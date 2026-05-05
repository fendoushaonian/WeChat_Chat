/**
 * Build flavor 控制 - 编译时确定, 运行时只读
 *   'agent' (默认): 代理版, 没有任何管理员功能
 *   'admin':       管理员版, 包含 ProductManager / 管理员入口等
 *
 * 通过 VITE_BUILD_FLAVOR 环境变量设置, 默认 'agent'
 *
 * 用法:
 *   if (IS_ADMIN_BUILD) { <ProductManager /> }
 */
const flavor = ((import.meta as any).env?.VITE_BUILD_FLAVOR || 'agent') as 'agent' | 'admin'

export const BUILD_FLAVOR: 'agent' | 'admin' = flavor === 'admin' ? 'admin' : 'agent'
export const IS_AGENT_BUILD = BUILD_FLAVOR === 'agent'
export const IS_ADMIN_BUILD = BUILD_FLAVOR === 'admin'
