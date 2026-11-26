import { Menu as AccountMenu } from '@base-ui/react/menu'
import { CircleUserRound, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconButton } from './Actions'

export default function SignedInAccount({ avatar, loggingOut, onOpen, onLogout }: {
  avatar: ReactNode; loggingOut: boolean; onOpen: () => void; onLogout: () => void
}) {
  return <AccountMenu.Root modal={false} onOpenChange={open => { if (open) onOpen() }}>
    <AccountMenu.Trigger render={<IconButton className="account-trigger account-trigger--signed-in" label="账号菜单（已登录）">{avatar}</IconButton>} />
    <AccountMenu.Portal>
      <AccountMenu.Positioner className="account-positioner" align="end" sideOffset={8}>
        <AccountMenu.Popup className="account-popup">
          <AccountMenu.LinkItem className="account-item" render={<Link to="/profile" />}>
            <CircleUserRound aria-hidden="true" />我的主页
          </AccountMenu.LinkItem>
          <AccountMenu.Item className="account-item" disabled={loggingOut} onClick={onLogout}>
            <LogOut aria-hidden="true" />退出登录
          </AccountMenu.Item>
        </AccountMenu.Popup>
      </AccountMenu.Positioner>
    </AccountMenu.Portal>
  </AccountMenu.Root>
}
