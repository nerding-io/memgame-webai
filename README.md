# AI Chat Game

Test your ability to identify AI vs human chat responses. Challenge yourself across different conversation styles and topics.

## Quick Start

Install dependencies:
```bash
npm install
```

Start development:
```bash
npm run dev
```

Deploy to production:
```bash
npm run deploy
```

## Local Development

1. Copy `.env.example` to `.env` and add your OpenAI API key
2. Run `npm run dev` to start:
   - Local server at http://localhost:3000 
   - SST dev environment

## Project Structure
```
.
├── README.md
├── instructions
│   └── example-category.md
├── package-lock.json
├── package.json
├── site
│   ├── categories.js
│   ├── game.js
│   ├── icons
│   ├── index.html
│   ├── llm.js
│   ├── manifest.json
│   ├── styles.css
│   └── sw.js
├── sst-env.d.ts
├── sst.config.ts
└── tsconfig.json

4 directories, 14 files
```

## Features

- Multiple chat categories and difficulty levels
- Real-time scoring and feedback
- Leaderboard tracking
- Responsive design

## Tech Stack

- Frontend: Vanilla JS
- Backend: AWS Lambda + API Gateway (SST)
- Storage: DynamoDB
- CDN: CloudFront

## Contributing

PRs welcome! Please:
1. Fork repo
2. Create feature branch
3. Submit PR

## License

MIT
