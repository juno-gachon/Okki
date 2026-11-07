/* 보안: 일반 텍스트는 textContent, 구조가 필요한 내부 템플릿만 정화 후 HTML로 넣습니다.
 * 정화 도구가 없거나 실패하면 원문 HTML로 우회하지 않습니다.
 */
function safeHTML(markup) {
  return DOMPurify.sanitize(String(markup ?? ''), {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['srcdoc'],
  });
}
function setHTML(element, markup) { element.innerHTML = safeHTML(markup); }
function replaceHTML(element, markup) { element.outerHTML = safeHTML(markup); }

// 동작은 고정 허용목록, 인자는 이스케이프된 JSON 데이터입니다. 문자열을 코드로 평가하지 않습니다.
function uiActionAttrs(type, name, args = []) {
  if (!['click', 'change', 'submit'].includes(type)) throw new Error('Unsupported UI event');
  return `data-ui-${type}="${esc(name)}" data-ui-${type}-args="${esc(JSON.stringify(args))}"`;
}
function dispatchUIAction(event) {
  const attribute = `data-ui-${event.type}`;
  const targets = [];
  // 버블링 중 렌더링으로 노드가 교체되어도 기존 부모 경로와 this를 유지합니다.
  for (let node = event.target; node && node !== document; node = node.parentElement) {
    if (node.hasAttribute?.(attribute)) targets.push(node);
  }
  for (const element of targets) {
    const name = element.getAttribute(attribute);
    if (!Object.hasOwn(uiActions, name)) continue;
    let args;
    try { args = JSON.parse(element.getAttribute(`${attribute}-args`) || '[]'); }
    catch { continue; }
    if (!Array.isArray(args)) continue;
    const result = uiActions[name].call(element, event, args);
    if (result === false) event.preventDefault();
    if (event.cancelBubble) break;
  }
}
// 이벤트 위임으로 재렌더링 이후에도 인라인 코드 없이 동작합니다.
for (const type of ['click', 'change', 'submit']) document.addEventListener(type, dispatchUIAction);
