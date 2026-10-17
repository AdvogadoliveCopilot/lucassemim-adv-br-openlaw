<?php
/**
 * CONFIGURAÇÃO PRIVADA — /api/.claude-config.php
 */

// Cole sua chave obtida no console da Anthropic:
define('ANTHROPIC_API_KEY', getenv('ANTHROPIC_API_KEY') ?: 'COLOQUE_SUA_CHAVE_AQUI');

// Máximo de requisições por minuto por IP (protege contra robôs):
define('MAX_REQUESTS_PER_MINUTE', 10);

// Limite de tokens por resposta (mantém respostas ágeis e econômicas):
define('MAX_TOKENS', 350);