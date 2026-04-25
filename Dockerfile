FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=socket_chat
ENV MYSQL_USER=socket_chat_user
ENV MYSQL_PASSWORD=User@1234

# EXPOSE 3308

# Install netcat for HTTP hack
RUN apt-get update && apt-get install -y netcat

EXPOSE 3306

CMD sh -c "mysqld & while true; do echo -e 'HTTP/1.1 200 OK\n\nOK' | nc -l -p $PORT; done"