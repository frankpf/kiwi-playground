#!/bin/bash
to=$1
shift

cont=$(docker run --memory=200m --cpus=".8" -d "$@")
code=$(timeout "$to" docker wait "$cont" || true)
docker kill $cont &> /dev/null
echo -n 'status: '
if [ -z "$code" ]; then
    echo timeout
else
    echo exited: $code
fi

echo output:
docker logs $cont

docker rm $cont &> /dev/null
