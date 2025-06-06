# AI-FAQ - TypeScriptエラー解決のための参照ドキュメント

このファイルは、解決に20分以上かかったTypeScriptエラーとその解決方法を記録しています。

## Q: superadmin-billing.routes.tsでvalidationHandlerのエラーが出ます
A: validationHandlerは1つの引数のみ受け取ります。Joiスキーマではなくexpress-validatorのValidationChain[]を使用してください。

```typescript
// ❌ 間違い
validationHandler(superAdminBillingSummaryQuerySchema, 'query')

// ✅ 正しい
validateBillingSummaryQuery,  // ValidationChain[]
handleValidationErrors,
```

## Q: TestAuthHelperでgetSuperAdminTokenメソッドが見つかりません
A: getSuperAdminTokenは存在しません。createTestUserWithToken('superadmin')を使用してください。

```typescript
// ❌ 間違い
const superAdminToken = await authHelper.getSuperAdminToken();

// ✅ 正しい
const { token } = await TestAuthHelper.createTestUserWithToken('superadmin');
const superAdminToken = token;
```

## Q: dbTestHelperのインポートエラーが出ます
A: dbTestHelperではなくDatabaseTestHelperをインポートしてください。

```typescript
// ❌ 間違い
import { dbTestHelper } from '../../utils/db-test-helper';

// ✅ 正しい
import { DatabaseTestHelper } from '../../utils/db-test-helper';
```

## Q: UserRole.SUPERADMINが存在しないエラーが出ます
A: 正しくはUserRole.SUPER_ADMINです（アンダースコア付き）。

```typescript
// ❌ 間違い
UserRole.SUPERADMIN

// ✅ 正しい
UserRole.SUPER_ADMIN
```

## Q: LinearProgressのvalue型エラーが出ます
A: valueの型チェックを追加してください。

```typescript
// ❌ 間違い
<LinearProgress value={Number(value)} />

// ✅ 正しい
<LinearProgress value={typeof value === 'number' ? value : Number(value)} />
```

## Q: フォームstateのTypeScriptエラーが出ます
A: useStateの型を明示的に指定してください。特にbirthLocationオブジェクトの型定義に注意。

```typescript
// ❌ 間違い
const [formData, setFormData] = useState({
  birthLocation: { name: '', longitude: 0, latitude: 0 }
});

// ✅ 正しい
const [formData, setFormData] = useState<{
  birthLocation: { name: string; longitude: number; latitude: number; };
}>({
  birthLocation: { name: '', longitude: 0, latitude: 0 }
});
```

## Q: MUI v7のGrid APIエラーが出ます
A: itemプロパティを削除し、size={{ xs: 6 }}形式を使用してください。

```typescript
// ❌ 間違い
<Grid item xs={6}>

// ✅ 正しい  
<Grid size={{ xs: 6 }}>
```