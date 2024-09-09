import { getDataFromPath } from '../bot'

describe('getDataFromPath', () => {
    test('should return data when there is no output path', () => {
        const data = { id: '123' }
        expect(getDataFromPath(data)).toBe(data)
        expect(getDataFromPath(data, '')).toBe(data)
    })
})