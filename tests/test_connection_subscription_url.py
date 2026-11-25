import json
import subprocess
from pathlib import Path
from urllib.parse import quote


PAGE = Path(__file__).resolve().parents[1] / "connection" / "index.html"
BASE = "https://vpn.fotur.tech/proxy/c1df117e-7883-494d-80cd-f6d3c3525180"


def run_page(url):
    harness = r"""
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[1], 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const nodes = {};
function node(id) { return nodes[id] ||= {href:'', dataset:{}, classList:{add(){}}, addEventListener(k, f){this[k] = f;}}; }
let copied = '';
const document = {getElementById:node, querySelector:node, visibilityState:'visible'};
const window = {location:{search:'?config=' + encodeURIComponent(process.argv[2])}, setTimeout(){}};
const navigator = {clipboard:{writeText:async value => {copied = value;}}};
vm.runInNewContext(script, {window, document, navigator, URL, URLSearchParams, encodeURIComponent});
Promise.resolve(node('copy-link').click({preventDefault(){}})).then(() => {
  console.log(JSON.stringify({happ:node('happ-link').href, incy:node('incy-link').href, hiddify:node('hiddify-link').href, copied}));
});
"""
    result = subprocess.run(["node", "-e", harness, str(PAGE), url], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def test_old_link_is_normalized_for_all_clients_and_clipboard():
    canonical = BASE + "/auto/"
    values = run_page(BASE + "/#Имя")
    assert values == {
        "happ": "happ://add/" + quote(canonical, safe="~()*!.'-"),
        "incy": "incy://add/" + quote(canonical, safe="~()*!.'-"),
        "hiddify": "hiddify://import/" + canonical,
        "copied": canonical,
    }
    assert run_page(canonical)["copied"] == canonical


def test_unrelated_links_are_not_rewritten():
    original = "https://example.com/sub?token=a%2Fb#Name"
    assert run_page(original)["copied"] == original
