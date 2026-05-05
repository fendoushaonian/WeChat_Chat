-- 商品归属隔离: 每个代理有独立的商品库, 互不可见
-- owner_agent_id NULL  = 管理员/品牌方拥有 (浏览器后台可见)
-- owner_agent_id = id  = 该代理私有 (仅这个代理在客户端能看到)

ALTER TABLE products
  ADD COLUMN owner_agent_id INT NULL DEFAULT NULL AFTER built_in,
  ADD INDEX idx_owner_agent (owner_agent_id, active)
