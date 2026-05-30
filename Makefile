.PHONY: dev build start lint deploy-preview deploy-prod

dev:
	bun run dev

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

deploy-preview:
	bunx vercel

deploy-prod:
	bunx vercel --prod
