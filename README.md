# Pré Requisitos:
+ Criar uma chave de API do GEMINI.
+ Criar uma conta na aws, criar um bucket S3

# Como rodar o projeto:

### Backend:
1. Completar os dados de `enviroment` presentes no DockerFile e no docker-compose e .env.

2. Dar build do docker-compose
```shell
docker-compose build
```

3. Dar run do docker-compose
```shell
docker-compose up -d
```

### Frontend
1. Completar os dados de `enviroment` presentes no .env.

2. Dar build da imagem do dockerfile
 ```shell
docker build -t NOME-IMAGEM .
```

3. Dar run na imagem do dockerFile
 ```shell
docker run -it NOME-IMAGEM
```

# Aonde estão os testes da apicação:

### BACKEND:

`backend/src/test`

### FRONTEND

`frontend/src/app/tests`

# Melhorias Futuras
+ Https e escalabilidade com o uso do Elastic Beanstalk e Balance Loader da aws.
+ Robustez nos Testes do BackEnd.
+ Aprimoramento e detalhamento da documentação do backend.