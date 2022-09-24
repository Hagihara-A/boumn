バンドル対象pkgの名前、バンドル出力ディレクトリをもらう
cwd取得
ディレクトリがwsのrootか調べる -> ファイル一覧取得 -> pnpm-workspace.yamlが存在するか、package.jsonにworkspacesプロパティが存在するならroot
違うなら一個上でやり直し。
ルートディレクトリでも見つからなかったらエラー

ルートのpackage.jsonを読み込み
(pnpmなら)pnpm-workspace.yamlを読み込み
ワークスペースの対象globを取得

ws指定globにpackage.jsonを繋げて、ワークスペースパッケージのマニフェストのパスを取得。
それらを全部読み込む。name, dependencies, filesが必要。パッケージのパスも合わせて持っておく。

バンドル対象pkgの依存を全部たどって依存パッケージのパスとそのマニフェストを列挙する。

まずルートパッケージのバンドル対象ファイルをdestDirにコピー
package.jsonなら`"name": "file:./pkgname"`に書き換える

destDirにバンドル対象パッケージのデプロイファイルをコピー
destDir/${packagename}に依存パッケージのデプロイファイルをコピー
デプロイファイルを書き込むとき、dependenciesの　`"pkgName": "workspace:*"`を `"name": "file:../pkgname"`に書き換える

デプロイファイルとは

```
files 
package.json
README
LICENSE / LICENCE
mainのファイル
```