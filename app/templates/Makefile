PROJECT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
TARGET_DIR=$(PROJECT_DIR)target

CI_BUILD_NUMBER ?= $(USER)-snapshot
CI_WORKDIR ?= $(shell pwd)
PROJECT = ai-blt
CLUSTER = blt-stage  # Kubernetes cluster to deploy to (managed by A&I team)
ZONE = asia-east1-c  # ZONE for the sandbox cluster

PUBLISH_TAG_APP ?= "mup.cr/<%= name %>/webapp:$(CI_BUILD_NUMBER)"
PUBLISH_TAG_ASSET ?= "mup.cr/<%= name %>/webasset:$(CI_BUILD_NUMBER)"

TRAVIS_PULL_REQUEST ?= "FALSE"

PRODUCTION_DOMAIN = <%= production_domain %>

# lists all available targets
list:
	@sh -c "$(MAKE) -p no_op__ | \
		awk -F':' '/^[a-zA-Z0-9][^\$$#\/\\t=]*:([^=]|$$)/ {split(\$$1,A,/ /);\
		for(i in A)print A[i]}' | \
		grep -v '__\$$' | \
		grep -v 'make\[1\]' | \
		grep -v 'Makefile' | \
		sort"

# required for list
no_op__:

__set-prod:
	$(eval PROJECT=meetup-prod)
	$(eval CLUSTER=mup-prod)
	$(eval ZONE=us-east1-b)
	$(eval LOAD_BALANCER_IP=<%= load_balancer_ip %>)

__package:
	docker build \
		--build-arg NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY} \
		--build-arg NEW_RELIC_APP_NAME=${NEW_RELIC_APP_NAME} \
		-t $(PUBLISH_TAG_APP) .
	mkdir -p build
	docker run \
		--rm \
		-u="root" \
		-v $(CI_WORKDIR)/build:/data \
		$(PUBLISH_TAG_APP) \
		cp -r build/browser-app/ /data

__package-test:
	@echo 'no component/integration/other tests'

coveralls:
	docker run \
		--rm \
		-e COVERALLS_SERVICE_NAME=travis-pro \
		-e COVERALLS_REPO_TOKEN=$(COVERALLS_REPO_TOKEN) \
		-e TRAVIS=$(TRAVIS) \
		-e TRAVIS_BRANCH=$(TRAVIS_BRANCH) \
		-e TRAVIS_COMMIT=$(TRAVIS_COMMIT) \
		-e TRAVIS_JOB_ID=$(TRAVIS_JOB_ID) \
		-e TRAVIS_PULL_REQUEST=$(TRAVIS_PULL_REQUEST) \
		$(PUBLISH_TAG_APP) \
		yarn run coveralls


transifex:
	docker run \
		--rm \
		-e TRAVIS_BRANCH=$(TRAVIS_BRANCH) \
		-e TRAVIS_PULL_REQUEST=$(TRAVIS_PULL_REQUEST) \
		-e TRANSIFEX_USER=$(TRANSIFEX_USER) \
		-e TRANSIFEX_PW=$(TRANSIFEX_PW) \
		$(PUBLISH_TAG_APP) \
		npm-run-all tx:push tx:pushTxMaster

run-flow:
	docker run -it -v $(CI_WORKDIR):/app meetup/node-flow:0.39.0

# called by Travis and prod build
package: prepackage __package __package-asset __package-test postpackage

postpackage: run-flow coveralls transifex

prepackage: ;

version:
	@echo $(CI_BUILD_NUMBER)

__package-asset:
	docker build -t $(PUBLISH_TAG_ASSET) -f Dockerfile.asset .

# run by travis / CI
# push prod env + code to registry
publish: package
	docker push $(PUBLISH_TAG_APP)
	docker push $(PUBLISH_TAG_ASSET)

__deploy-only:
	# create namespace if it doesn't exist
	kubectl apply -f infra/namespace.yaml

	# update load balancer entry point
	LOAD_BALANCER_IP=$(LOAD_BALANCER_IP) \
		envtpl < infra/webapp-svc.yaml | kubectl apply -f -

	# update ssl proxy config
	PRODUCTION_DOMAIN=$(PRODUCTION_DOMAIN) \
		envtpl < infra/ssl-proxy-config.yaml | kubectl apply -f -

	# inject the current CI_BUILD_NUMBER into the deployment spec
	ANNOTATION_CHANGE_CAUSE="build #$(CI_BUILD_NUMBER) deployed on $(shell date -u +%Y-%m-%d%n%H:%M:%S%z);" \
	PUBLISH_TAG_APP=$(PUBLISH_TAG_APP) \
	PUBLISH_TAG_ASSET=$(PUBLISH_TAG_ASSET) \
		envtpl < infra/deploy.yaml | kubectl apply -f -

__get-credentials:
	@gcloud config set project $(PROJECT)
	@gcloud container clusters get-credentials $(CLUSTER) --zone $(ZONE)

__get-creds-deploy: __get-credentials __deploy-only
deploy-prod: __set-prod __get-creds-deploy

set-ns: ## Set namespace for current kubectl context.
	kubectl config set-context $$(kubectl config current-context) \
		--namespace <%= name %>

prep:
	@echo "=== Checking node"
	@node --version
	@echo
	@echo "=== Checking yarn"
	@yarn --version
	@echo
	@echo "=== Checking homebrew"
	@brew --version
	@echo
	@echo "=== You're ready for web-platform development!"

prep-deploy:
	@echo "=== Checking docker"
	@docker --version
	@docker pull hello-world
	@docker run hello-world
	@echo
	@echo "=== Checking gcloud"
	@gcloud version
	@echo
	@echo "=== Checking kubectl"
	@kubectl version
	@echo
	@echo "=== Checking python"
	@which python
	@python --version
	@if [ `which python` != "/usr/local/bin/python" ]; then echo "if running macOS, \`brew install python\` to avoid permission conflicts when pip installing"; fi
	@echo
	@echo "=== Checking envtpl"
	@type envtpl || (echo; echo "envtpl not found... Try:"; echo "  pip install envtpl"; echo; false)
	@echo
	@echo "=== Checking yeoman"
	@yo --version
	@echo
	@echo "=== You're ready for web-platform deployment work!"

run-local:
	docker run \
	--rm \
	-it \
	--env-file $(HOME)/.<%= name %>.config \
	-p $(DEV_SERVER_PORT):8000 \
	$(PUBLISH_TAG_APP)

run-local-asset:
	docker run \
	--rm \
	-it \
	-p $(ASSET_SERVER_PORT):8001 \
	$(PUBLISH_TAG_ASSET)
