#!/bin/sh
# Build both sites and publish them to Cloudflare Pages. Needs wrangler
# (npm i -g wrangler) and CLOUDFLARE_API_TOKEN (and CLOUDFLARE_ACCOUNT_ID)
# in the environment, plus the rok toolchain and the spec / library
# checkouts the generator reads (see the repo README).
#
#   deploy/cloudflare/deploy.sh
#
# It assembles public/ (archived doc versions + a fresh dev + the home
# site) with scripts/assemble.sh, then deploys public/www to the
# rok-lang-org project and public/docs to docs-rok-lang-org.
set -eu
here=$(cd "$(dirname "$0")/../.." && pwd)
cd "$here"

# site.local.rokon's preview base_url / docs_url must not reach a deploy.
scripts/assemble.sh

cp deploy/cloudflare/_headers.docs public/docs/_headers

wrangler pages deploy public/www  --project-name rok-lang-org      --branch main
wrangler pages deploy public/docs --project-name docs-rok-lang-org --branch main
echo "deployed rok-lang.org and docs.rok-lang.org"
