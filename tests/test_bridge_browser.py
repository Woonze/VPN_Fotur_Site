"""Run with pytest and Playwright; all external requests are intercepted."""

import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


def test_legacy_browser_marker_does_not_override_server_cooldown():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel='chrome', headless=True)
            page = browser.new_page()
            page.add_init_script("""
                localStorage.setItem('fotur-free-access-issued', '1');
                window.turnstile = {render: () => 'test-widget', getResponse: () => 'test-token', reset: () => {}};
            """)
            page.route('https://challenges.cloudflare.com/**', lambda route: route.abort())
            page.route('https://api.ipify.org/**', lambda route: route.fulfill(json={'ip': '192.0.2.1'}))
            page.route('https://pay.fotur.tech/site-api/**', lambda route: route.fulfill(json={
                'ok': True, 'status': 'code_sent', 'request_token': 'synthetic-token', 'message': 'Код отправлен'
            }))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            form = page.locator('[data-lead-form="bridge"]')
            form.locator('[name=email]').fill('test@gmail.com')
            form.locator('button[type=submit]').click()
            form.locator('[data-code-wrap]').wait_for(state='visible', timeout=10000)
            assert 'Код отправлен' in form.locator('[data-status]').inner_text()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
