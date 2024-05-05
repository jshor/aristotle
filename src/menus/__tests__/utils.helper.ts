import { MenuItem, MenuItemConstructorOptions } from "electron";

export function buildMenu (menu: MenuItemConstructorOptions[]) {
  return menu as unknown as (MenuItem & {
    submenu: MenuItem[]
  })[]
}
