# 見本のデータ

[国会会議録検索システムの検索用API](https://kokkai.ndl.go.jp/api.html)の応答を、そのまま保存した。モック、単体テスト、E2E で使う。応答の形が変わったら、同じリクエストで取り直し、この表を直す。

| ファイル                           | 取得した日 | リクエストのURL                                                                                 |
| ---------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `kokkai/speech/success.json`       | 2026-11-13 | `https://kokkai.ndl.go.jp/api/speech?any=物価&maximumRecords=3&recordPacking=json`              |
| `kokkai/speech/empty.json`         | 2026-11-13 | `https://kokkai.ndl.go.jp/api/speech?any=存在しない語句zzqx&recordPacking=json`                 |
| `kokkai/speech/error.json`         | 2026-11-13 | `https://kokkai.ndl.go.jp/api/speech?any=物価&maximumRecords=0&recordPacking=json`（400）       |
| `kokkai/meeting-list/success.json` | 2026-11-13 | `https://kokkai.ndl.go.jp/api/meeting_list?from=2026-10-28&maximumRecords=3&recordPacking=json` |
| `kokkai/meeting/success.json`      | 2026-11-13 | `https://kokkai.ndl.go.jp/api/meeting?issueID=122204024X00720261106&recordPacking=json`         |
