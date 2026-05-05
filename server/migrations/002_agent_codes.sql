-- 代理激活码体系
-- status: 0=未激活, 1=已激活(可用), 2=停用(禁止再连接)

CREATE TABLE IF NOT EXISTS agent_codes (
  id              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(64)   NOT NULL UNIQUE,
  label           VARCHAR(255)  NULL,
  status          TINYINT(1)    NOT NULL DEFAULT 0,
  device_info     VARCHAR(500)  NULL,
  activated_ip    VARCHAR(64)   NULL,
  activated_at    DATETIME      NULL,
  last_active_at  DATETIME      NULL,
  last_active_ip  VARCHAR(64)   NULL,
  use_count       INT           NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_last_active (last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
