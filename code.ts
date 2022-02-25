// このファイルには、プラグインのメインコードが格納されています。
// メインコードからは Figma の「scene」(Figma ドキュメントを構成するレイヤーの階層) にアクセスできます
// 参考記事（https://zenn.dev/ixkaito/articles/how-to-make-a-figma-plugin）

// プラグイン起動時にプラグイン用モーダルUIを表示します。
figma.showUI(__html__);

/**
 * プラグイン起動時に実行され、現在選択しているテキストを取得しHTML側へ渡します
 * 以下の場合にはアラートを出しプラグインを閉じます
 * - 選択しているものが無い
 * - 複数選択を行なっている
 * - テキスト以外の要素を選択している
 *
 * @param page
 */
function postTextForUI(page: PageNode) {
  if (page.selection.length !== 1) {
    // 複数の要素を選択している場合、または何も選択していない場合
    figma.ui.postMessage({
      type: "selectMultiple",
    });
    return;
  }

  // 現在選択中のNode
  const selectionNode = page.selection[0];

  if (selectionNode.type === "TEXT") {
    if (selectionNode.characters) {
      figma.ui.postMessage({
        type: "networkRequest",
        current: selectionNode.characters,
      });
    } else {
      // テキスト要素を選択しているものの、1文字も入力されていない場合
      figma.ui.postMessage({
        type: "notTextNode",
      });
    }
  } else {
    // テキスト以外の要素を選択している場合
    figma.ui.postMessage({
      type: "notTextNode",
    });
  }
}
postTextForUI(figma.currentPage);

/**
 * HTMLページ内から `parent.postMessage`を呼び出すと、発火する処理です
 * 渡す引数によって処理の分岐を行います
 *
 * @param msg
 */
figma.ui.onmessage = (msg) => {
  if (msg === "closePlugin") {
    // プラグインを閉じる
    figma.closePlugin();
  }
};
