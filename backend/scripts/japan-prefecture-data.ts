// 日本47都道府県の県庁所在地データ
export const JAPAN_PREFECTURES = [
  // 北海道・東北
  { name: "札幌", prefecture: "北海道", longitude: 141.3544, latitude: 43.0618, adjustmentMinutes: 26 },
  { name: "青森", prefecture: "青森県", longitude: 140.7400, latitude: 40.8244, adjustmentMinutes: 22 },
  { name: "盛岡", prefecture: "岩手県", longitude: 141.1527, latitude: 39.7036, adjustmentMinutes: 25 },
  { name: "仙台", prefecture: "宮城県", longitude: 140.8719, latitude: 38.2682, adjustmentMinutes: 23 },
  { name: "秋田", prefecture: "秋田県", longitude: 140.1023, latitude: 39.7186, adjustmentMinutes: 20 },
  { name: "山形", prefecture: "山形県", longitude: 140.3633, latitude: 38.2404, adjustmentMinutes: 21 },
  { name: "福島", prefecture: "福島県", longitude: 140.4676, latitude: 37.7608, adjustmentMinutes: 22 },
  
  // 関東
  { name: "水戸", prefecture: "茨城県", longitude: 140.4467, latitude: 36.3418, adjustmentMinutes: 22 },
  { name: "宇都宮", prefecture: "栃木県", longitude: 139.8836, latitude: 36.5658, adjustmentMinutes: 20 },
  { name: "前橋", prefecture: "群馬県", longitude: 139.0608, latitude: 36.3911, adjustmentMinutes: 16 },
  { name: "さいたま", prefecture: "埼玉県", longitude: 139.6489, latitude: 35.8617, adjustmentMinutes: 19 },
  { name: "千葉", prefecture: "千葉県", longitude: 140.1233, latitude: 35.6047, adjustmentMinutes: 20 },
  { name: "東京", prefecture: "東京都", longitude: 139.6917, latitude: 35.6895, adjustmentMinutes: 18 },
  { name: "横浜", prefecture: "神奈川県", longitude: 139.6425, latitude: 35.4478, adjustmentMinutes: 19 },
  
  // 中部
  { name: "新潟", prefecture: "新潟県", longitude: 139.0235, latitude: 37.9026, adjustmentMinutes: 16 },
  { name: "富山", prefecture: "富山県", longitude: 137.2118, latitude: 36.6956, adjustmentMinutes: 9 },
  { name: "金沢", prefecture: "石川県", longitude: 136.6256, latitude: 36.5944, adjustmentMinutes: 7 },
  { name: "福井", prefecture: "福井県", longitude: 136.2218, latitude: 36.0652, adjustmentMinutes: 5 },
  { name: "甲府", prefecture: "山梨県", longitude: 138.5684, latitude: 35.6642, adjustmentMinutes: 14 },
  { name: "長野", prefecture: "長野県", longitude: 138.1810, latitude: 36.6513, adjustmentMinutes: 13 },
  { name: "岐阜", prefecture: "岐阜県", longitude: 136.7223, latitude: 35.3912, adjustmentMinutes: 7 },
  { name: "静岡", prefecture: "静岡県", longitude: 138.3828, latitude: 34.9769, adjustmentMinutes: 14 },
  { name: "名古屋", prefecture: "愛知県", longitude: 136.9066, latitude: 35.1815, adjustmentMinutes: 8 },
  
  // 近畿
  { name: "津", prefecture: "三重県", longitude: 136.5086, latitude: 34.7302, adjustmentMinutes: 6 },
  { name: "大津", prefecture: "滋賀県", longitude: 135.8685, latitude: 35.0045, adjustmentMinutes: 3 },
  { name: "京都", prefecture: "京都府", longitude: 135.7681, latitude: 35.0116, adjustmentMinutes: 3 },
  { name: "大阪", prefecture: "大阪府", longitude: 135.5023, latitude: 34.6937, adjustmentMinutes: 2 },
  { name: "神戸", prefecture: "兵庫県", longitude: 135.1955, latitude: 34.6901, adjustmentMinutes: 1 },
  { name: "奈良", prefecture: "奈良県", longitude: 135.8325, latitude: 34.6851, adjustmentMinutes: 3 },
  { name: "和歌山", prefecture: "和歌山県", longitude: 135.1675, latitude: 34.2261, adjustmentMinutes: 1 },
  
  // 中国
  { name: "鳥取", prefecture: "鳥取県", longitude: 134.2378, latitude: 35.5038, adjustmentMinutes: -3 },
  { name: "松江", prefecture: "島根県", longitude: 133.0504, latitude: 35.4723, adjustmentMinutes: -8 },
  { name: "岡山", prefecture: "岡山県", longitude: 133.9350, latitude: 34.6617, adjustmentMinutes: -4 },
  { name: "広島", prefecture: "広島県", longitude: 132.4596, latitude: 34.3853, adjustmentMinutes: -10 },
  { name: "山口", prefecture: "山口県", longitude: 131.4706, latitude: 34.1859, adjustmentMinutes: -14 },
  
  // 四国
  { name: "徳島", prefecture: "徳島県", longitude: 134.5593, latitude: 34.0658, adjustmentMinutes: -2 },
  { name: "高松", prefecture: "香川県", longitude: 134.0434, latitude: 34.3401, adjustmentMinutes: -4 },
  { name: "松山", prefecture: "愛媛県", longitude: 132.7657, latitude: 33.8416, adjustmentMinutes: -9 },
  { name: "高知", prefecture: "高知県", longitude: 133.5311, latitude: 33.5597, adjustmentMinutes: -6 },
  
  // 九州・沖縄
  { name: "福岡", prefecture: "福岡県", longitude: 130.4017, latitude: 33.5902, adjustmentMinutes: -18 },
  { name: "佐賀", prefecture: "佐賀県", longitude: 130.2988, latitude: 33.2494, adjustmentMinutes: -19 },
  { name: "長崎", prefecture: "長崎県", longitude: 129.8737, latitude: 32.7503, adjustmentMinutes: -20 },
  { name: "熊本", prefecture: "熊本県", longitude: 130.7417, latitude: 32.7898, adjustmentMinutes: -17 },
  { name: "大分", prefecture: "大分県", longitude: 131.6126, latitude: 33.2382, adjustmentMinutes: -14 },
  { name: "宮崎", prefecture: "宮崎県", longitude: 131.4202, latitude: 31.9077, adjustmentMinutes: -14 },
  { name: "鹿児島", prefecture: "鹿児島県", longitude: 130.5581, latitude: 31.5966, adjustmentMinutes: -18 },
  { name: "那覇", prefecture: "沖縄県", longitude: 127.6792, latitude: 26.2124, adjustmentMinutes: -29 }
];