import { eventBus } from '@/utils/event-bus'

let cartEL: HTMLElement | undefined = undefined
let style: HTMLElement | undefined = undefined

// 添加开始任务的动画，类似购物车
export function useStartTaskAnimation(cart: HTMLElement) {
  if (cartEL) {
    return
  }
  cartEL = cart

  style = document.createElement('style')
  style.innerHTML = `
    @keyframes -cart-animation- {
      0% {
        width: 20px;
        height: 20px;
        transform: translate3d(var(--start-x), var(--start-y), 0);
        opacity: 1;
      }
      100% {
        width: 8px;
        height: 8px;
        transform: translate3d(var(--end-x), var(--end-y), 0);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)

  eventBus.on('exec-backup', ({ clientX, clientY }) => {
    const cartRect = cart.getBoundingClientRect()
    // 购物车中心位置
    const cartCX = cartRect.left + cartRect.width / 2
    const cartCY = cartRect.top + cartRect.height / 2

    const ball = document.createElement('div') // 创建容器
    ball.style.position = 'fixed'
    ball.style.left = '0'
    ball.style.top = '0'
    ball.style.background = 'var(--app-primary-color)'
    ball.style.borderRadius = '50%'
    ball.style.zIndex = '3001'
    ball.style.animation = '-cart-animation- 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
    document.body.appendChild(ball)
    ball.style.setProperty('--start-x', `${clientX}px`)
    ball.style.setProperty('--start-y', `${clientY}px`)
    ball.style.setProperty('--end-x', `${cartCX}px`)
    ball.style.setProperty('--end-y', `${cartCY}px`)
    setTimeout(() => {
      document.body.removeChild(ball)
    }, 1500)
  })
}

export function removeAddCartAnimation() {
  if (cartEL && style) {
    document.head.removeChild(style)
    cartEL = undefined
  }
}
