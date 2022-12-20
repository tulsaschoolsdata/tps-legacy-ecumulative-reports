SHELL = /bin/bash
IMAGE = tulsaschoolsdata/tps-legacy-ecum-reports:latest

default: help

help:

clean:
	rm -rf out

docker-build:
	docker build -t $(IMAGE) .

docker-run-report:
	docker run --rm -it \
		--cap-add=SYS_ADMIN \
		--env-file .env \
		-v $(shell pwd)/out:/home/node/app/out \
		-v $(shell pwd)/src:/home/node/app/src \
		-v $(shell pwd)/templates:/home/node/app/templates \
		$(IMAGE) \
		npx ts-node src/script.ts
