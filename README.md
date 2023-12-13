Template Cesium Viewer implemented in Next.js 14.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

To begin with, go to the `nextjs-cesium-viewer` directory and follow the steps mentioned below.

## Getting Started

First, install the required packages:

```bash
# By default, npm install will install all modules listed as dependencies in package.json
npm install 
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Folder structure

1. `public`: Static assets to be served. Here you can store your images or other useful assets to load into the application.
2. `src`: Application source folder. This is where almost everything will be handled.
	- `src/app`: Main page folder. You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
	- `src/components`: React Components folder. Here you will find the Components to be used in the project. The Cesium Viewer can be modified on `components/map.tsx`.
	- `src/styles`: Stylization scripts folder. Here you can add the `.css` files of your Components.
3. `node_modules`: External modules that the project depends upon. This folder is created after `npm install`.
4. `.next`: Once the project is launched using `npm run dev`, this folder will be created automatically to store page cache and various features.
5. `others`: After the aforementioned folders, there are various `.json`, `.ts` and `.js` scripts regarding project configuration.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

