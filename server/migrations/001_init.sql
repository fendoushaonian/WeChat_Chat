-- 朋友圈文案助手 商品库 schema
-- 建议在创建数据库 + 用户后再执行

CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(64)   NOT NULL PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  tagline       VARCHAR(500)  NULL,
  selling_points JSON         NULL,
  description   TEXT          NULL,
  scenes        JSON          NULL,
  extra_rules   TEXT          NULL,
  cover_url     VARCHAR(2000) NULL,
  price_text    VARCHAR(100)  NULL,
  built_in      TINYINT(1)    NOT NULL DEFAULT 0,
  active        TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order    INT           NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_sort (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)   NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME      NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
