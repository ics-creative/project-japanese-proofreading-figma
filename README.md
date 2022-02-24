# テキスト校正くん for Figma

Figma上で日本語の文章をチェックする拡張機能です。該当のテキストを選択した状態でプラグインを起動すると、文章内の問題のある箇所をパネルに表示します。

ウェブ業界の専門用語を含め、一般的な文章のルールに沿って主に以下のようなチェックを行います。

- 「ですます」調と「である」調の混在
- ら抜き言葉
- 二重否定
- 同じ助詞の連続使用
- 同じ接続詞の連続使用
- 逆接の接続助詞「が」の連続使用
- 全角と半角アルファベットの混在
- 弱い日本語表現の利用（〜かもしれない）
- 読点の数（1文に4つまで）
- ウェブの用語や名称の表記統一（Javascript→JavaScript、Github→GitHub等）
- 漢字の閉じ方、開き方（下さい→ください、出来る→できる等）

## ローカル環境での実行方法

1.リポジトリをクローンします
```shell
git clone https://github.com/ics-creative/project-japanese-proofreading-figma.git
cd project-japanese-proofreading-figma
```

2.依存関係をインストールします
```shell
npm install
```

3.プラグインのビルドを行います
```shell
npm run dev
```

4.Figmaのデスクトップアプリを起動します

5.`Menu > Plugins > Development > Import plugin from manifest...` の順に選択します

6.project-japanese-proofreading-figma/manifest.json を選択します

7.校正を行いたいテキストを選択後、`Menu > Plugins > Development > Japanese Proofreading`を選択し、プラグインを実行します
