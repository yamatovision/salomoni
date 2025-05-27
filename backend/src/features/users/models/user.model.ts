import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserProfile, UserRole, UserStatus, AuthMethod } from '../../../types';

export interface UserDocument extends Document, Omit<UserProfile, 'id'> {
  password?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '有効なメールアドレスを入力してください'],
  },
  password: {
    type: String,
    minlength: [8, 'パスワードは8文字以上で入力してください'],
    select: false, // デフォルトではパスワードを返さない
  },
  name: {
    type: String,
    required: [true, '名前は必須です'],
    trim: true,
    maxlength: [100, '名前は100文字以内で入力してください'],
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    // requiredはカスタムバリデータで処理する
  },
  profileImage: {
    type: String,
  },
  birthDate: {
    type: Date,
  },
  birthTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '有効な時刻形式（HH:mm）を入力してください'],
  },
  birthLocation: {
    name: String,
    longitude: Number,
    latitude: Number,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  phone: {
    type: String,
    match: [/^[\d-]+$/, '有効な電話番号を入力してください'],
  },
  authMethods: [{
    type: String,
    enum: Object.values(AuthMethod),
  }],
  lineUserId: {
    type: String,
    sparse: true,
    unique: true,
  },
  employeeNumber: {
    type: String,
  },
  department: {
    type: String,
  },
  hireDate: {
    type: Date,
  },
  lastLoginAt: {
    type: Date,
  },
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    userAgent: String,
    platform: String,
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    language: {
      type: String,
      default: 'ja',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
  },
  aiCharacterId: {
    type: Schema.Types.ObjectId,
    ref: 'AICharacter',
  },
  tokenUsage: {
    current: { type: Number, default: 0 },
    limit: { type: Number, default: 10000 },
    resetDate: { type: Date },
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokens;
      // ObjectIdをstringに変換
      if (ret.organizationId) {
        ret.organizationId = ret.organizationId.toString();
      }
      if (ret.aiCharacterId) {
        ret.aiCharacterId = ret.aiCharacterId.toString();
      }
      return ret;
    }
  }
});

// インデックス
// emailとlineUserIdはスキーマ定義でunique: trueが設定されているためインデックスは自動作成される
userSchema.index({ organizationId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'role': 1 });
userSchema.index({ createdAt: -1 });

// カスタムバリデーション: SuperAdmin以外はorganizationIdが必須
userSchema.path('organizationId').validate(function(value: any) {
  // SuperAdminの場合はorganizationIdは不要
  if (this.role === 'superadmin') {
    return true;
  }
  // それ以外のロールの場合はorganizationIdが必須
  return !!value;
}, 'スーパー管理者以外は組織IDが必須です');

// パスワードのハッシュ化
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// パスワード検証メソッド
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// 仮想フィールド
userSchema.virtual('isActive').get(function() {
  return this.status === UserStatus.ACTIVE;
});

userSchema.virtual('isSuperAdmin').get(function() {
  return this.role === UserRole.SUPER_ADMIN;
});

userSchema.virtual('isOwner').get(function() {
  return this.role === UserRole.OWNER;
});

userSchema.virtual('isAdmin').get(function() {
  return this.role === UserRole.ADMIN;
});

userSchema.virtual('hasManagementRole').get(function() {
  return [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(this.role);
});

// 静的メソッド
userSchema.statics.findByEmail = function(email: string) {
  if (!email) return null;
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

userSchema.statics.findByLineUserId = function(lineUserId: string) {
  return this.findOne({ lineUserId });
};

userSchema.statics.findActiveByOrganization = function(organizationId: string) {
  return this.find({ 
    organizationId, 
    status: UserStatus.ACTIVE 
  });
};

// インスタンスメソッド
userSchema.methods.suspend = async function(_reason?: string) {
  this.status = UserStatus.SUSPENDED;
  return this.save();
};

userSchema.methods.activate = async function() {
  this.status = UserStatus.ACTIVE;
  return this.save();
};

userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.hasRole = function(role: UserRole): boolean {
  return this.role === role;
};

userSchema.methods.setRole = async function(role: UserRole) {
  this.role = role;
  return this.save();
};


export const UserModel = model<UserDocument>('User', userSchema);