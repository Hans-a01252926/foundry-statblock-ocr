# Statblock to JSON

Upload an image of a D&D 5e statblock and get back Foundry VTT-ready JSON. Built for DMs who'd rather not hand-key monsters into Foundry.

![Default Look](/readme_imgs/default_vercel.png)

## Features

- Drag-and-drop or browse to upload statblock images
- Multi-page support — add several images for statblocks that span pages
- Client-side image resizing before upload (smaller payloads, lower API cost)
- Vision-based extraction into structured JSON via the Claude API
- Editable output, so you can fix any misread before exporting
- Copy to clipboard or download as `.json`

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- Tailwind CSS
- [Claude API](https://docs.claude.com) for image-to-JSON extraction
- Deployed on [Vercel](https://vercel.com)

## How it works

```
Browser  ──upload images──▶  /api/parse (server)  ──▶  Claude vision API
   ▲                                                        │
   └──────────── editable JSON ◀── parsed result ◀──────────┘
```

The API key lives only in the server-side route - it is never exposed to the browser.

## Getting started

```bash
git clone https://github.com/Hans-a01252926/foundry-statblock-ocr.git
cd foundry-statblock-ocr
npm install
```

Create `.env.local` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

Get a key from the [Claude Console](https://console.anthropic.com), then run:

```bash
npm run dev
```

Open http://localhost:3000.

Or use 

## Usage

1. Drag one or more statblock images onto the upload area (or click **browse**).
2. For a multi-page statblock, add each page; they're read together as one creature.
3. Click **Extract JSON**.
4. Review and edit the result, then **Copy** or **Download .json**.

To get the most accurate result, anchor the output to your own Foundry version: export any monster actor from Foundry (right-click → *Export Data*) and use that structure as the target schema in the extraction prompt.

## Deployment

This app deploys on [Vercel](https://vercel.com). Install the Vercel CLI once:

```bash
npm install -g vercel
```

From the project root, link and create the project (follow the prompts the first time you run it):

```bash
vercel
```

Add your API key so the deployed app can reach Claude — either in the dashboard under **Settings → Environment Variables**.

Then publish a production deployment:

```bash
vercel --prod
```

Re-run `vercel --prod` any time you want to push your latest changes live.


## Limitations

- Vision extraction is strong but not perfect on stylized fonts, busy backgrounds, or low-resolution images — review the output before importing.
- Very large statblocks can exceed the output token limit; raise `max_tokens` in `app/api/parse/route.ts` if needed.
- The deployed app uses your API key for every request, so consider adding access control before sharing the URL publicly.

## License

Code is released under the [MIT License](LICENSE). This tool ships no game content. D&D 5e SRD material is available separately under CC BY 4.0.

## Acknowledgments

- [Foundry VTT](https://foundryvtt.com) and its D&D 5e system
- The [5e Statblock Importer](https://github.com/Aioros/5e-statblock-importer) module — a great option if you'd rather paste statblock text than generate JSON