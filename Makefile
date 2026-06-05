.PHONY: install clean \
        web web-dev web-build web-start web-lint \
        mobile mobile-start mobile-android mobile-ios mobile-prebuild

# ----- Setup -----
install:          ## Install all workspace deps (pnpm)
	pnpm install

clean:            ## Remove node_modules + build caches, then reinstall
	pnpm -r exec rm -rf node_modules .next .turbo .expo dist || true
	rm -rf node_modules
	pnpm install

# ----- Web (apps/web, Next.js) -----
web: web-dev      ## Alias: run web dev server

web-dev:          ## Run web dev server (http://localhost:3000)
	pnpm dev

web-build:        ## Production build of web app
	pnpm build

web-start:        ## Serve the production build
	pnpm --filter @shiftready/web start

web-lint:         ## Lint web workspace
	pnpm lint

# ----- Mobile (apps/mobile, Expo) -----
mobile: mobile-start   ## Alias: start Expo dev server

mobile-start:     ## Start Expo dev server (Metro / Expo Go)
	pnpm --filter @shiftready/mobile start

mobile-android:   ## Build + run native Android
	pnpm --filter @shiftready/mobile android

mobile-ios:       ## Build + run native iOS (macOS only)
	pnpm --filter @shiftready/mobile ios

mobile-prebuild:  ## Regenerate native projects (expo prebuild --clean)
	pnpm --filter @shiftready/mobile prebuild
