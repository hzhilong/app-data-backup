import mitt from 'mitt'

type Events = {
  'exec-backup': {
    clientX: number
    clientY: number
  }
}

export const emitter = mitt<Events>()
