import { JSONFilePreset } from "lowdb/node"

interface Data {
    invites: {
        name: string
        url: string
        expiresAt: number
    }[]
}

const storage = await JSONFilePreset<Data>('storage.json', {
    invites: []
})

export default storage