// このファイルには、プラグインのメインコードが格納されています。
// メインコードからは Figma の「scene」(Figma ドキュメントを構成するレイヤーの階層) にアクセスできます
// 参考記事（https://zenn.dev/ixkaito/articles/how-to-make-a-figma-plugin）

/**
 * アラート表示を行う際にpostMessageへ渡す型の定義です
 */
type alertType = {
  /** アラートの種類 */
  type: "notTextNode" | "hasNothing";
};

/**
 * ネットワークリクエストを行う際にpostMessageへ渡す型の定義です
 */
type requestType = {
  type: "networkRequest";
  /** 校正対象のテキストとnodeをまとめた配列 */
  textArray: { text: string; node: SceneNode }[];
  /** 現在の校正対象のインデックス */
  index: number;
};

// プラグイン起動時にプラグイン用モーダルUIの設定を行います。この段階では非表示です。
figma.showUI(__html__, {
  width: 344,
  height: 255,
  title: "テキスト校正くん",
  visible: false,
});

// 校正を行うテキスト情報を格納する配列です
const textArray: { text: string; node: SceneNode }[] = [];

/**
 * テキスト情報とnodeを取得しtextArrayに格納する為の処理です
 * @param node
 */
const setTextArrayObject = (node: SceneNode) => {
  if (node.type === "TEXT") {
    if (node.characters) {
      textArray.push({
        text: node.characters,
        node: node,
      });
    }
  } else if (node.type === "SHAPE_WITH_TEXT" || node.type === "STICKY") {
    if (node.text.characters) {
      textArray.push({
        text: node.text.characters,
        node: node,
      });
    }
  } else if ("children" in node) {
    if (node.children) {
      node.children.forEach((child) => {
        searchChildren(child);
      });
    }
  }
};

/**
 * 選択したオブジェクトから、テキスト情報とnodeを取得しtextArrayに格納する為の2階層目以降の処理です
 * @param child
 */
const searchChildren = (child: SceneNode) => {
  setTextArrayObject(child);
};

/**
 * 選択したオブジェクトから、テキスト情報とnodeを取得しtextArrayに格納する為の1階層目の処理です
 * @param item
 */
const setTextArray = (item: PageNode) => {
  item.selection.forEach((node) => {
    setTextArrayObject(node);
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
      type: "hasNothing",
    } as alertType);
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
    } as alertType);
  } else {
    figma.ui.postMessage({
      type: "networkRequest",
      textArray: textArray,
      index: 0,
    } as requestType);
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
    } as requestType);
    // 校正対象のテキストを選択状態とし、スクロールとズームを行う
    figma.currentPage.selection = [textArray[msg + 1].node];
    figma.viewport.scrollAndZoomIntoView([textArray[msg + 1].node]);
  }
};
