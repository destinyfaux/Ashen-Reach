#!/usr/bin/env python3
"""ASHENREACH screenshot harness v2 — SEQUENTIAL phases, ONE WebGL page at a time
(software GL dies with two concurrent render loops).

Phase A: player joins (WebGL) → walk → 01 join, 02 entry, 03 explored
Phase B: DM joins (headless UI client) → 04 dm panel → sets night + storm,
         spawns a monster near party → leaves
Phase C: fresh player joins (WebGL) → 05 night, 06 storm, 07 monster

Usage: python3 tools/shoot.py [phases...]  default: all
"""
import asyncio
import sys
import os
import json
from playwright.async_api import async_playwright

WORLD = 'http://localhost:5173/?lowgfx=1'
DM = 'http://localhost:5173/?headless=1'
OUT = os.path.join(os.path.dirname(__file__), '..', 'shots')
os.makedirs(OUT, exist_ok=True)


async def retry(fn, tries=3, wait=1500):
    for i in range(tries):
        try:
            return await fn()
        except Exception as e:
            if i == tries - 1:
                raise
            print(f'  retry {i+1}: {str(e).splitlines()[0][:90]}')
            await asyncio.sleep(wait)


async def shot(page, name, wait=2600):
    await page.wait_for_timeout(wait)
    await retry(lambda: page.evaluate("() => { window.__AR_PAUSE__ = true; }"))
    await page.wait_for_timeout(400)
    path = os.path.join(OUT, f'{name}.png')
    await page.screenshot(path=path)
    await retry(lambda: page.evaluate("() => { window.__AR_PAUSE__ = false; }"))
    print('saved', path)
    await asyncio.sleep(0.8)


async def dom_shot(page, name, wait=400):
    """For headless pages (no engine to pause)."""
    await page.wait_for_timeout(wait)
    path = os.path.join(OUT, f'{name}.png')
    await page.screenshot(path=path)
    print('saved', path)


async def join_as(page, url, name, dm=False):
    await page.goto(url, wait_until='domcontentloaded')
    await page.wait_for_timeout(1700)
    await retry(lambda: page.fill('#charname', name, timeout=12000))
    if dm:
        await retry(lambda: page.check('.join-dm input', force=True, timeout=9000))
    await retry(lambda: page.click('.join-enter', force=True, timeout=9000))
    await page.wait_for_timeout(2300)


async def walk(page, w1=1100, a=450, w2=1400):
    await page.keyboard.down('w'); await page.wait_for_timeout(w1); await page.keyboard.up('w')
    if a:
        await page.keyboard.down('KeyA'); await page.wait_for_timeout(a); await page.keyboard.up('KeyA')
    if w2:
        await page.keyboard.down('w'); await page.wait_for_timeout(w2); await page.keyboard.up('w')


async def dm_button(page, text):
    await retry(lambda: page.evaluate(
        "(t) => { const b=[...document.querySelectorAll('.dm-panel button')].find(x=>x.textContent===t); if(b) b.click(); }", text))


async def main(names):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        errors = []

        # ─── Phase A: player world shots
        if any(n in names for n in ('join', 'world')):
            page = await browser.new_page(viewport={'width': 1600, 'height': 900})
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: errors.append(str(getattr(e, 'stack', e))))
            await page.goto(WORLD, wait_until='domcontentloaded')
            await page.wait_for_timeout(1700)
            if 'join' in names:
                await shot(page, '01-join', 300)
            await retry(lambda: page.fill('#charname', 'Osric of the Ash', timeout=12000))
            await retry(lambda: page.click('.join-enter', force=True, timeout=9000))
            await page.wait_for_timeout(2300)
            if 'world' in names:
                await walk(page, 1100, 450, 0)
                # QA cinematic frame: 3/4 front view, braziers in frame
                await retry(lambda: page.evaluate('''() => {
                  const e = window.__AR_ENGINE__;
                  const a = e.actors.get(e.controls.tokenId);
                  const p = a ? a.group.position : {x: 38, z: 120};
                  // camera south-east of the character, character faces the camera
                  const cam = { x: p.x + 11, y: 6.0, z: p.z + 12 };
                  window.__AR_QA_CAM__ = { pos: cam, look: { x: p.x, y: 3.9, z: p.z } };
                  if (a) a.group.rotation.y = Math.atan2(cam.x - p.x, cam.z - p.z);
                }'''))
                await shot(page, '02-world-entry', 800)
                await retry(lambda: page.evaluate("() => { delete window.__AR_QA_CAM__; }"))
                await walk(page, 0, 0, 1400)
                await retry(lambda: page.evaluate('''() => {
                  const e = window.__AR_ENGINE__;
                  const a = e.actors.get(e.controls.tokenId);
                  const p = a ? a.group.position : {x: 38, z: 110};
                  const cam = { x: p.x - 12, y: 6.6, z: p.z + 11 };
                  window.__AR_QA_CAM__ = { pos: cam, look: { x: p.x, y: 3.9, z: p.z } };
                  if (a) a.group.rotation.y = Math.atan2(cam.x - p.x, cam.z - p.z);
                }'''))
                await shot(page, '03-world-explored', 600)
                await retry(lambda: page.evaluate("() => { delete window.__AR_QA_CAM__; }"))
            else:
                await walk(page, 800, 0, 0)
            await page.close()

        # ─── Phase B: DM (headless UI client)
        if any(n in names for n in ('dm', 'night', 'rain', 'combat_view')):
            dm = await browser.new_page(viewport={'width': 1600, 'height': 900})
            await join_as(dm, DM, 'The Warden', dm=True)
            role = await retry(lambda: dm.evaluate("() => !!document.querySelector('.hud-dm')"))
            print('DM role granted:', role)
            if 'dm' in names:
                await retry(lambda: dm.click('.dm-toggle', force=True, timeout=9000))
                await dm.wait_for_timeout(400)
                await dom_shot(dm, '04-dm-panel')
            else:
                await retry(lambda: dm.click('.dm-toggle', force=True, timeout=9000))
                await dm.wait_for_timeout(300)
            if 'night' in names:
                await dm_button(dm, 'night'); await dm.wait_for_timeout(600)
            if 'rain' in names:
                await dm_button(dm, 'storm'); await dm.wait_for_timeout(600)
            if 'combat_view' in names:
                await dm_button(dm, 'near party'); await dm.wait_for_timeout(600)
            await dm.close()
            await asyncio.sleep(1.0)

        # ─── Phase C: player sees the DM's changes
        if any(n in names for n in ('night', 'rain', 'combat_view')):
            page = await browser.new_page(viewport={'width': 1600, 'height': 900})
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: errors.append(str(getattr(e, 'stack', e))))
            await join_as(page, WORLD, 'Rainlyn')
            await walk(page, 1500, 0, 0)
            if 'night' in names:
                await shot(page, '05-night', 1500)
            if 'rain' in names:
                await shot(page, '06-storm', 1200)
            if 'combat_view' in names:
                await shot(page, '07-monster', 600)
            await page.close()

        report = {'errors': errors[:20]}
        with open(os.path.join(OUT, 'report.json'), 'w') as f:
            json.dump(report, f, indent=1)
        print(json.dumps(report, indent=1)[:900])
        await browser.close()


if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    if not args:
        args = ['join', 'world', 'dm', 'night', 'rain', 'combat_view']
    asyncio.run(main(args))
