FROM rabbitmq:4.2-management-alpine
USER rabbitmq
RUN wget -P /opt/rabbitmq/plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v4.2.0/rabbitmq_delayed_message_exchange-4.2.0.ez
RUN rabbitmq-plugins enable rabbitmq_delayed_message_exchange rabbitmq_web_stomp