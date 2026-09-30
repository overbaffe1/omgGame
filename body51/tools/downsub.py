"""Скачивает русские автосубтитры (TXT) через downsub.com в headless Chromium (GitHub Actions).
usage: python downsub.py START END   (номера строк из body51/raw/all_streams.tsv, 1-based)"""
import sys, os, json, re, asyncio
from playwright.async_api import async_playwright
rows=[l.rstrip("\n").split("\t") for l in open("body51/raw/all_streams.tsv",encoding="utf-8") if l.strip()]
A,B=int(sys.argv[1]),int(sys.argv[2]); OUT="body51/txt"; os.makedirs(OUT,exist_ok=True)
DBG=os.environ.get("DBG")
async def one(ctx,n,r):
    vid=r[0]; fn=f"{OUT}/{n:03d}_{vid}.txt"
    if os.path.exists(fn) and os.path.getsize(fn)>200: return "skip"
    page=await ctx.new_page(); info={}
    async def onresp(resp):
        if "get-info" in resp.url or "downsub" in resp.url and "json" in (resp.headers.get("content-type") or ""):
            try: info["j"]=await resp.json(); info["u"]=resp.url
            except: pass
    page.on("response",onresp)
    try:
        await page.goto(f"https://downsub.com/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D{vid}",timeout=90000)
        await page.wait_for_selector("text=Russian (auto-generated)",timeout=90000)
        if DBG: open("body51/raw/downsub_dbg.json","w").write(json.dumps(info.get("j"),ensure_ascii=False)[:20000]+"\n"+info.get("u",""))
        row=page.locator("div,li,tr").filter(has_text=re.compile(r"^\s*SRT\s*VTT\s*TXT\s*RAW.*Russian \(auto-generated\)\s*$",re.S)).last
        btn=row.get_by_text("TXT",exact=True).first
        async with page.expect_download(timeout=90000) as d:
            await btn.click()
        dl=await d.value; tmp=await dl.path(); txt=open(tmp,encoding="utf-8",errors="replace").read()
        txt=re.sub(r"<[^>]+>","",txt)  # убрать теги <b>,<i>,<font>
        with open(fn,"w",encoding="utf-8") as f:
            f.write(f"# {n:03d} {vid} | {r[1] if len(r)>1 else ''} | {r[2] if len(r)>2 else ''}\n# https://youtu.be/{vid} | downsub ru-auto\n\n{txt}\n")
        return f"OK {len(txt)}"
    except Exception as e:
        if DBG: await page.screenshot(path="body51/raw/downsub_dbg.png"); open("body51/raw/downsub_dbg.html","w").write(await page.content())
        return f"FAIL {str(e)[:150]}"
    finally: await page.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True,user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36")
        sem=asyncio.Semaphore(4); log=open(f"{OUT}/_downsub_log.txt","a")
        async def job(n,r):
            async with sem:
                res=await one(ctx,n,r); log.write(f"{n} {r[0]} {res}\n"); log.flush(); print(n,res,flush=True)
        await asyncio.gather(*[job(n,rows[n-1]) for n in range(A,B+1)])
asyncio.run(main())
