import { $prose } from "@milkdown/kit/utils";
import { Plugin } from "@milkdown/kit/prose/state";
import { lift } from "@milkdown/kit/prose/commands";
import { liftListItem } from "@milkdown/kit/prose/schema-list";

function isEmptyCurrentBlock(state) {
  const { selection } = state;

  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  const parent = $from.parent;

  return parent.isTextblock && parent.content.size === 0;
}

function hasAncestor($from, nodeName) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === nodeName) {
      return true;
    }
  }

  return false;
}

export const editorSmartExitPlugin = $prose(
  () =>
    new Plugin({
      props: {
        handleKeyDown(view, event) {
          if (event.key !== "Enter" && event.key !== "Backspace") {
            return false;
          }

          const { state } = view;

          if (!isEmptyCurrentBlock(state)) {
            return false;
          }

          const { $from } = state.selection;

          // 列表：
          // 第一回车仍然创建下一条空列表；
          // 当光标已经处在“空列表项”时，再按 Enter 或 Backspace，
          // 自动退出当前列表层级，回到普通正文。
          const listItemType =
            state.schema.nodes.list_item || state.schema.nodes.listItem;

          if (listItemType && hasAncestor($from, listItemType.name)) {
            const exitList = liftListItem(listItemType);

            if (exitList(state, view.dispatch)) {
              event.preventDefault();
              return true;
            }
          }

          // 引用：
          // 引用文字后回车得到空引用行；
          // 再按 Enter 或 Backspace 时自动退出引用，回到普通正文。
          if (hasAncestor($from, "blockquote")) {
            if (lift(state, view.dispatch)) {
              event.preventDefault();
              return true;
            }
          }

          return false;
        },
      },
    })
);
