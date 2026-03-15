import { beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.restoreAllMocks()
})