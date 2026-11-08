# podcasdo-audio-frontend

Podcas堂のNext.jsフロントエンドです。Knowledge Baseは別リポジトリで管理します。

## Local development

```sh
npm install
npm run dev
```

APIは`NEXT_PUBLIC_API_BASE_URL`で指定します。初期状態ではfixture APIを利用し、Google OAuth・S3・本番デプロイは接続しません。

## Dependency maintenance and checks

Node.js 24.15.0以降の24系、または26以降を使用してください（検証環境: Node.js 24.22.2 / npm 11.19.1）。

```sh
npm ci
npm audit --include=dev
npm test
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

ESLint 10では、Next.js公式プラグインのrecommended / Core Web Vitals、
typescript-eslint、React Hooks、ESLint Reactの推奨設定を直接組み合わせています。
ESLint 10に非対応のpeer依存と古いminimatchを含む`eslint-config-next`、
`eslint-plugin-react`、`eslint-plugin-import`、`eslint-plugin-jsx-a11y`から移行しました。
旧import・jsx-a11yのルールは含まれず、React用ルールもESLint Reactの推奨セットに変わります。
データ取得・URL同期のeffect内でのstate更新は従来どおり許可しています。

`overrides`は、minimatchの名前付きAPIを使用するESLint、config-array、
typescript-estreeに限定して11.0.4以降を指定しています。
これはGHSA-g3hv-75wg-m249（globパターンによるDoS）の対策で、
上流の依存範囲が修正版を含むようになったら削除を検討してください。
TypeScriptはtypescript-eslintの対応範囲（6.1未満）に合わせて6.0系に固定しています。
