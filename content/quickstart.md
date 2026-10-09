# Vercel Quickstart

This guide takes you from an empty laptop to a live public URL for your hackathon app, one step at a time. You don't need any prior experience with Vercel, GitHub or web hosting. Expect about 45 minutes the first time.

## How it fits together

Three services work together: GitHub stores your code, Vercel runs your app on the internet, and SSI's LiteLLM gateway gives it access to AI models.

![How a hackathon app is built, deployed and calls AI](/guide/architecture.png)

Only your API route ever sees your key. The browser talks to your app, and your app talks to LiteLLM.

## Words you'll see

You only need these eight terms. Come back to this table whenever a step uses one.

| Term | What it means in plain words |
| --- | --- |
| Vercel | A website that hosts your app on the internet for free and gives it a public address like `my-hack.vercel.app`. |
| GitHub | A website that stores your code online. Vercel reads your code from here. |
| Repository (repo) | One project's folder on GitHub, including the full history of every change. |
| Git | The program on your laptop that sends your code to GitHub. `push` means "upload my latest changes". |
| Deployment | One published version of your app. Every time you push code, Vercel builds a new deployment automatically. |
| API route | A small piece of server code inside your app (a file named `route.ts`). It runs on Vercel's servers, never in the user's browser, so it can safely hold secrets. |
| Environment variable | A named secret setting, such as your API key, stored outside your code. Locally it lives in `.env.local`; on Vercel you type it into the project settings. |
| LiteLLM | SSI's gateway to the AI models. Your personal key lets your app call the models through it, with a spend cap per key. |

## Before you start

You need a laptop with internet access, admin rights to install two programs, and the three values the organizers email you.

- A laptop where you can install software (Windows or Mac)
- An email address for your GitHub and Vercel sign-ups (a personal address is fine)
- Cursor or Claude Code, which you already have
- Your three LiteLLM values from the organizers (below)

| Value | What it is | Example of its shape |
| --- | --- | --- |
| `LITELLM_BASE_URL` | The address of SSI's LiteLLM gateway | `https://<gateway address from organizers>/v1` |
| `LITELLM_API_KEY` | Your personal key. Treat it like a password. | `sk-` followed by a long string |
| `LITELLM_MODEL` | The name of the model you're allowed to use | A short name such as `claude-sonnet` |

Copy the three values exactly as sent, including any `/v1` at the end of the address. Don't share your key with anyone, including teammates; every participant gets their own.

## Step 1: Install Node.js, Git and an editor

Install two free programs, then confirm both respond in a terminal. Skip any you already have.

1. **Node.js** runs JavaScript on your laptop and comes with `npm`, which installs code libraries.
   - Go to [nodejs.org](https://nodejs.org), download the **LTS** version (version 20 or newer), and run the installer with the default options.
2. **Git** sends your code to GitHub.
   - Go to [git-scm.com/downloads](https://git-scm.com/downloads), download it for your system, and run the installer. On Windows, clicking **Next** through every screen is fine.
3. **Your editor**: use Cursor (recommended), or VS Code with Claude Code. Both have a built-in terminal: in Cursor, open the menu **Terminal → New Terminal**.

**Check it worked.** Close and reopen your terminal, then run these three commands one at a time:

```bash
node -v
npm -v
git --version
```

Each should print a version number, such as `v22.11.0`. If you see "not recognized" or "command not found", restart your laptop and try again.

**Tell Git who you are** (one time only, use your own name and email):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## Step 2: Check your LiteLLM key works

Ask the gateway for its list of models. If you get a list back, your key and address are correct.

In your terminal, run this, replacing the two placeholders with your values. Put your base URL first, then `/models`.

```bash
curl.exe <LITELLM_BASE_URL>/models -H "Authorization: Bearer <LITELLM_API_KEY>"
```

- **Windows:** type `curl.exe`, not `curl`. In PowerShell, plain `curl` is a different command and gives a confusing error.
- **Mac:** type `curl` without `.exe`.

| What you see | What it means |
| --- | --- |
| Text containing `"data"` and model names | It works. Note that your `LITELLM_MODEL` value appears in the list. |
| `401` or `Authentication Error` | The key is wrong or has a typo. Copy it again from the email. |
| `Could not resolve host` or a timeout | The address is wrong, or your network blocks it. Check the URL; try another network. |

## Step 3: Create your app on your laptop

You'll start from **Next.js**, the web framework Vercel was built for. Vercel deploys it with zero configuration.

1. In the terminal, go to the folder where you keep projects, for example `cd Documents`.
2. Run this command. `my-hack` is your project's name: use lowercase letters, numbers and hyphens only.

   ```bash
   npx create-next-app@latest my-hack
   ```

3. If it asks `Ok to proceed? (y)`, press **Enter**. It then asks a few setup questions: press **Enter** on each one to accept the recommended defaults. Make sure **App Router** is set to **Yes**, which is the default.
4. Wait for `Success! Created my-hack`. Then move into the new folder and add the library that talks to LiteLLM:

   ```bash
   cd my-hack
   npm install openai
   ```

   The `openai` library works with any OpenAI-compatible gateway, including LiteLLM. Your app still uses whichever model the organizers enabled, not necessarily an OpenAI model.
5. Open the folder in Cursor: **File → Open Folder → my-hack**.
6. Start the app on your laptop:

   ```bash
   npm run dev
   ```

7. Open <http://localhost:3000> in your browser. You should see the Next.js welcome page. `localhost` means "this laptop only"; nobody else can see it yet.

To stop the app, click the terminal and press **Ctrl + C**. Run `npm run dev` again to restart it.

**Using AI to build this:** you can ask Cursor or Claude Code to do any step in this guide for you, for example: "Create a Next.js app with an API route that calls LiteLLM using the openai package and the LITELLM_* environment variables." Read what it changes before accepting.

## Step 4: Store your secrets safely in .env.local

Your key goes in a special file that stays on your laptop and is never uploaded to GitHub.

1. In Cursor's file panel, right-click the top-level `my-hack` folder, not `app`, and choose **New File**.
2. Name it exactly `.env.local`, starting with a dot.
3. Paste these three lines, with your own values after each `=` sign. Use no quotes and no spaces around `=`.

   ```
   LITELLM_BASE_URL=https://<gateway address from organizers>/v1
   LITELLM_API_KEY=sk-your-own-key
   LITELLM_MODEL=claude-sonnet
   ```

4. Save the file. If `npm run dev` is running, stop it with **Ctrl + C** and start it again: Next.js reads this file only at startup.
5. **Confirm it won't be uploaded.** Open the file named `.gitignore` in the same folder and check that it contains a line starting with `.env`, such as `.env*` or `.env*.local`. Next.js adds this for you. If it's missing, add the line `.env*.local` yourself.

The names on the left, such as `LITELLM_API_KEY`, are how your code finds each value. Keep them exactly as written, because Step 5's code and Vercel's settings use the same names.

## Step 5: Make your first LLM call

You'll add two files: an API route that calls the model on the server, and a page that talks to that route. This is the pattern every hackathon app should follow: **the browser never calls LiteLLM directly.**

**File 1: the API route (server code).** In the `app` folder, create a folder named `api`; inside it, a folder named `chat`; inside that, a file named `route.ts`. The full path is `app/api/chat/route.ts`. If your project has a `src` folder, use `src/app/api/chat/route.ts`. Paste:

```ts
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Connects to SSI's LiteLLM gateway using your secret settings
    const client = new OpenAI({
      apiKey: process.env.LITELLM_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL,
    });

    const completion = await client.chat.completions.create({
      model: process.env.LITELLM_MODEL!,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
    });

    return Response.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err); // appears in your terminal locally, and in Vercel's Logs tab once deployed
    return Response.json({ error: "The AI call failed. Check the logs." }, { status: 500 });
  }
}
```

**File 2: the page (what users see).** Open `app/page.tsx`, delete everything in it, and paste:

```tsx
"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setReply(data.reply ?? data.error);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>My Hackathon App</h1>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} style={{ width: "100%" }} />
      <button onClick={ask} disabled={loading}>{loading ? "Thinking..." : "Ask"}</button>
      <p style={{ whiteSpace: "pre-wrap" }}>{reply}</p>
    </main>
  );
}
```

**Test it.** With `npm run dev` running, open <http://localhost:3000>, type a question and click **Ask**. An AI answer means your whole chain works. If you see the error message instead, read the red text in your terminal and check the Troubleshooting table below.

From here, build your real product on this foundation. Keep every AI call inside files under `app/api/`.

## Step 6: Put your code on GitHub

Vercel deploys from GitHub, so your code needs to be there first. Do this once; afterwards one command uploads each change.

**6a. Create a GitHub account.** Go to [github.com/signup](https://github.com/signup) and follow the prompts (email, password, username). Pick the free plan. Verify your email.

**6b. Create an empty repository.**

1. On GitHub, click the **+** at the top right, then **New repository**.
2. **Repository name:** `my-hack`, or your project's name.
3. Choose **Public**. Judges need to open your code, and it holds no secrets because `.env.local` is never uploaded.
4. **Leave every "Initialize" option unticked**: no README, no .gitignore, no license. Your laptop already has these files, and adding them here causes a conflict.
5. Click **Create repository**. Keep the page open: it shows your repo's address, like `https://github.com/<your-username>/my-hack.git`.

**6c. Upload your code.** In Cursor's terminal, inside the `my-hack` folder, run these lines one at a time, replacing `<your-username>`:

```bash
git add .
git commit -m "First version"
git branch -M main
git remote add origin https://github.com/<your-username>/my-hack.git
git push -u origin main
```

- `git add .` and `git commit` save a snapshot of your current files. If commit says "nothing to commit", that's fine: Next.js already made one.
- `git push` uploads it. The first time, a browser window asks you to sign in to GitHub. Approve it.

**Check it worked:** refresh the repository page on GitHub. You should see your files (`app`, `package.json`, and so on). **Make sure `.env.local` is NOT in the list.** If it is, stop and read "If your key leaks" under Rules for keys and data.

**Prefer clicking to typing?** Cursor can do 6b and 6c for you. Open the **Source Control** panel (the branch icon on the left), then click **Publish Branch** and choose **public repository**. It signs you in to GitHub and creates the repo.

## Step 7: Deploy on Vercel for the first time

This takes about five minutes and you do it only once. Afterwards Vercel redeploys automatically whenever you push.

**7a. Create your Vercel account**

1. Go to [vercel.com/signup](https://vercel.com/signup).
2. When asked about your plan, choose **Hobby** (free, for personal projects) and enter your name.
3. Click **Continue with GitHub** and approve the request. Your Vercel account is now linked to GitHub, with no separate password to remember.

**7b. Import your project**

1. On the Vercel dashboard, click **Add New… → Project**.
2. Under **Import Git Repository**, find `my-hack` and click **Import**.
   - If your repo isn't listed, click **Adjust GitHub App Permissions** (or **Install**). In the GitHub window, allow Vercel to access **All repositories** or select `my-hack`, then save. Your repo now appears.

**7c. Configure the project.** You now see the **Configure Project** screen.

| Setting | What to do |
| --- | --- |
| Project Name | Becomes your web address: `my-hack` gives `my-hack.vercel.app`. If the name is taken, Vercel adds a suffix. Change it here if you want a nicer address. |
| Framework Preset | Should already say **Next.js**. Leave it. |
| Root Directory | Leave as `./` |
| Build and Output Settings | Leave unchanged |
| **Environment Variables** | **Important: expand this section.** Add your three values (below). |

**Adding the environment variables:** for each of the three values, type the name in **Key**, paste the value in **Value**, then click **Add**:

- `LITELLM_BASE_URL` → your gateway address
- `LITELLM_API_KEY` → your key
- `LITELLM_MODEL` → your model name

Shortcut: copy all three lines from your `.env.local` and paste them into the first **Key** box. Vercel splits them into three entries automatically. Check that the names match exactly, with no extra spaces.

**7d. Deploy**

1. Click **Deploy**. Vercel shows a live build log. Building usually takes one to two minutes.
2. When it finishes, you see a **Congratulations** screen with a preview of your app. Click **Continue to Dashboard**.
3. Under **Domains**, find your public address, such as `https://my-hack.vercel.app`. Open it, type a question and click **Ask**.

If you get an AI answer, your app is live on the internet. Anyone with the link can use it, from any device.

If the build failed, or the page loads but **Ask** returns the error message, go to the Troubleshooting table below.

## Step 8: Keep building

From now on, a single push updates your live app. You never need to click Deploy again.

**The everyday loop**

1. Change your code in Cursor and test it at `http://localhost:3000`.
2. Save a snapshot and upload it:

   ```bash
   git add .
   git commit -m "Describe what you changed"
   git push
   ```

3. Within a minute or two Vercel builds and publishes it. Watch progress in your project's **Deployments** tab. A green **Ready** dot means it's live; refresh your `.vercel.app` page to see the change.

If the new version fails to build, your previous working version stays live. Push often, with small changes, so you always have a working app.

**Changing an environment variable** (for example, a new key from the organizers):

1. Open your project on Vercel, then **Settings → Environment Variables**.
2. Click the **⋯** next to the variable, choose **Edit**, update the value and save. Keep all environments ticked.
3. **Redeploy, or the change won't take effect:** go to **Deployments**, click the **⋯** on the top (latest) deployment, choose **Redeploy** and confirm.
4. Also update `.env.local` on your laptop and restart `npm run dev`.

**Where to look when something breaks**

| What you want to see | Where to find it |
| --- | --- |
| Why a build failed | **Deployments** → click the failed deployment → **Build Logs** |
| Errors while the app runs, such as a failed AI call | The **Logs** tab of your project. Your `console.error` messages appear here. |
| Your public address | Project overview → **Domains** |

**Preview deployments.** If you push to a branch other than `main`, Vercel builds a separate *preview* at a long, unique URL and leaves your main site untouched. Only pushes to `main` update `my-hack.vercel.app`.

## Step 9: Submit the right URLs

On this portal's [Submit page](/submit), enter two links and a one-line pitch before the deadline.

| Field | What to paste | Example |
| --- | --- | --- |
| GitHub repo URL | Your repository's page | `https://github.com/<your-username>/my-hack` |
| Live Vercel URL | Your **production domain**: the short address under **Domains** | `https://my-hack.vercel.app` |
| One-line pitch | What your app does, for whom | "An agent that fact-checks any article against public sources" |

**Use the short `.vercel.app` address, not a deployment link.** Vercel also shows long addresses such as `my-hack-a1b2c3-yourname.vercel.app`. Those point to one specific build and may ask visitors to log in to Vercel. Judges would hit a login wall.

**Final check before you submit:**

- Open your live URL in a private/incognito browser window, where you're not logged in to anything, and use the main feature end to end.
- Open your GitHub repo URL in the same private window and confirm the code is visible.
- Search your repo on GitHub for `sk-`: it must not find your key.
- Your last change shows **Ready** in Vercel's **Deployments** tab.

Keep your app deployed and working until winners are announced. Judging happens over the following weeks, and judges open your live URL directly.

## Troubleshooting

Most problems are a missing environment variable or a typo. Check the logs first: they usually name the cause.

| What you see | Likely cause | Fix |
| --- | --- | --- |
| `'node' / 'git' is not recognized` | Program not installed, or terminal opened before installing | Reinstall (Step 1), then close and reopen the terminal or restart the laptop. |
| `git push` is rejected with `fetch first` or `non-fast-forward` | The GitHub repo was created with a README or .gitignore | Run `git pull origin main --rebase`, then `git push` again. |
| Your repo doesn't appear in Vercel's import list | Vercel isn't allowed to see it | Click **Adjust GitHub App Permissions** and grant access to the repo (Step 7b). |
| Build fails on Vercel | A code error. Vercel builds more strictly than `npm run dev` | Run `npm run build` on your laptop: it shows the same error. Fix it, commit, push. |
| App works locally, but on Vercel **Ask** returns the error message | Environment variables missing or misspelled on Vercel | Check **Settings → Environment Variables** against `.env.local`, then **Redeploy** (Step 8). |
| Logs show `401` or `Authentication Error` | Wrong or expired key | Re-copy the key. If it still fails, ask the organizers. |
| Logs show `model not found` or `Invalid model name` | `LITELLM_MODEL` doesn't match an allowed model | Use a name from the list in Step 2. |
| Logs show `budget exceeded` | Your key reached its spend cap | Contact the organizers. Avoid loops that call the model endlessly. |
| Logs show a timeout, or the page shows `504` | One request ran longer than Vercel allows | See Tips for agentic apps below. |
| You changed a setting but nothing changed | No redeploy after changing an environment variable | **Deployments → ⋯ → Redeploy**. |
| Judges or friends see a Vercel login page | You shared a deployment-specific URL | Share the short `.vercel.app` production address (Step 9). |

## Rules for keys and data

Your app is on a public URL and your code is in a public repo, so these rules are not optional.

| Do | Don't |
| --- | --- |
| Keep your key in `.env.local` and in Vercel's Environment Variables | Paste your key into any code file, README or screenshot |
| Call LiteLLM only from files under `app/api/` (server code) | Call LiteLLM from page code, or name a variable `NEXT_PUBLIC_...`. Anything with that prefix is sent to every visitor's browser. |
| Use public data, or data you made up | Use client, customer or internal SSI data, even "just for testing" |
| Keep your own key to yourself | Share keys between participants |
| Use Accept Edits mode in Cursor or Claude Code, and review changes | Let an AI agent run fully unattended on your work laptop |

**Protect your budget.** Anyone who finds your URL can use your app, and every use spends your key's budget. The spend cap limits the damage. A simple passcode box in front of your app is a good stretch goal.

**If your key leaks** (committed to GitHub, posted in chat, shown in a screenshot): tell the organizers immediately so they can disable it and issue a new one. Deleting the file afterwards is not enough, because GitHub keeps the history.

## Tips for agentic apps

Agents make many model calls in a loop, which brings two things to plan for: tool calling and time limits.

**Tool calling works through LiteLLM.** The gateway uses the same request format as OpenAI, including `tools`, for models that support it. An agent loop looks like this:

1. Send the model the user's goal plus a list of tools it may use, such as `search_wikipedia`.
2. The model replies asking to call a tool, with arguments.
3. Your API route runs that tool (for example, fetches a public API) and sends the result back to the model.
4. Repeat until the model gives a final answer.

The free **Vercel AI SDK** handles this loop and streaming for you: install `ai` and `@ai-sdk/openai`, then point its provider at your `LITELLM_BASE_URL` and `LITELLM_API_KEY`. Ask Cursor or Claude Code to set it up; they know it well.

**Mind Vercel's time limit.** Each request to an API route has a maximum run time. If one request runs the whole agent loop, it can be cut off with a `504` error. Two fixes:

- **One step per request:** the page calls your API route once per agent step and shows each step as it arrives. This also gives judges the visible step-by-step trace they will look for.
- **Stream progress:** send partial results to the page as they happen, which the AI SDK does for you.

You can also raise a route's limit, up to your plan's maximum, by adding this line to its `route.ts`:

```ts
export const maxDuration = 60; // seconds
```

**Limit loops.** Always cap the number of steps (for example, 10), so a confused agent can't spend your whole budget.
