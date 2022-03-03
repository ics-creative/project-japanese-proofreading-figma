// このファイルには、プラグインのメインコードが格納されています。
// メインコードからは Figma の「scene」(Figma ドキュメントを構成するレイヤーの階層) にアクセスできます
// 参考記事（https://zenn.dev/ixkaito/articles/how-to-make-a-figma-plugin）

// プラグイン起動時にプラグイン用モーダルUIの設定を行います。この段階では非表示です。
figma.showUI(__html__, {
  width: 344,
  height: 255,
  title: "テキスト校正くん",
  visible: false,
});

// 校正を行うテキスト情報を格納する配列です
let textArray: { text: string; node: SceneNode }[] = [];

/**
 * 選択したオブジェクトの子要素をすべて探索し、テキスト情報とnodeを取得しtextArrayに格納します
 * @param child
 */
const searchChildren = (child: SceneNode) => {
  if (child.type === "TEXT") {
    if (child.characters) {
      textArray.push({
        text: child.characters,
        node: child,
      });
    }
  } else if ("children" in child) {
    if (child.children) {
      child.children.forEach((child) => {
        searchChildren(child);
      });
    }
  }
};

/**
 * 選択したオブジェクトから、テキスト情報とnodeを取得しtextArrayに格納します
 * @param item
 */
const setTextArray = (item: PageNode) => {
  item.selection.forEach((parent) => {
    if (parent.type === "TEXT") {
      if (parent.characters) {
        textArray.push({
          text: parent.characters,
          node: parent,
        });
      }
    } else if (parent.type === "SHAPE_WITH_TEXT" || parent.type === "STICKY") {
      if (parent.text.characters) {
        textArray.push({
          text: parent.text.characters,
          node: parent,
        });
      }
    } else if ("children" in parent) {
      if (parent.children) {
        parent.children.forEach((child) => {
          searchChildren(child);
        });
      }
    }
  });
};

/**
 * プラグイン起動時に実行され、現在選択しているテキストを取得しHTML側へ渡します
 * 以下の場合にはアラートを出しプラグインを閉じます
 * - 選択しているものが無い
 * - 複数選択を行なっている
 * - テキスト以外の要素を選択している
 *
 * @param page
 */
const postTextForUI = (page: PageNode) => {
  if (page.selection.length === 0) {
    // 何も選択していない場合
    figma.ui.postMessage({
      type: "selectMultiple",
    });
    return;
  }

  // 選択したオブジェクトからテキストとそのノードをまとめた配列を作成
  setTextArray(page);
  // レイヤーので降順並ぶので、昇順に直します
  textArray.reverse();

  if (textArray.length === 0) {
    figma.ui.postMessage({
      // 選択したオブジェクトにテキストが含まれていない場合
      type: "notTextNode",
    });
  } else {
    figma.ui.postMessage({
      type: "networkRequest",
      textArray: textArray,
      index: 0,
    });
    figma.ui.show();
    // 校正対象のテキストを選択状態とし、スクロールとズームを行う
    figma.currentPage.selection = [textArray[0].node];
    figma.viewport.scrollAndZoomIntoView([textArray[0].node]);
  }
};
postTextForUI(figma.currentPage);

/**
 * HTMLページ内から `parent.postMessage`を呼び出すと、発火する処理です
 * 渡す引数によって処理の分岐を行います
 *
 * @param msg
 */
figma.ui.onmessage = (msg) => {
  if (msg === "panelResize") {
    // パネルのリサイズ
    figma.ui.resize(600, 400);
  } else if (msg === "closePlugin") {
    // 校正対象が無いなどの例外処理時にはプラグインを閉じる
    figma.closePlugin();
  } else if (msg === textArray.length - 1) {
    // 次の校正指摘が無い場合プラグインを閉じる
    figma.closePlugin();
  } else {
    // 次の校正指摘を表示する
    figma.ui.resize(344, 255);
    figma.ui.postMessage({
      type: "networkRequest",
      textArray: textArray,
      index: msg + 1,
    });
    // 校正対象のテキストを選択状態とし、スクロールとズームを行う
    figma.currentPage.selection = [textArray[msg + 1].node];
    figma.viewport.scrollAndZoomIntoView([textArray[msg + 1].node]);
  }
};
