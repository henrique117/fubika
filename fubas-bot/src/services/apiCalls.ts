import osuApiClient from "./axiosClient"
import getApiErrorMessage from "./errorHandler"
import { IBeatmap, IPlayer, IScore } from "../interfaces/interfaces.export"

export async function getPlayer(id: string): Promise<IPlayer>{
    
    try{
        const response = await osuApiClient.get(`user/${id}`)


        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no getPlayer:", message)
        throw new Error(message)
    }
}

export async function getRecentScore(id: string): Promise<Array<IScore>>{
    
    try{
        const response = await osuApiClient.get(`user/${id}/recent`)

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no getRecentScore:", message)
        throw new Error(message)
    }
}

export async function getBeatmap(id: string): Promise<IBeatmap>{
    
    try{
        const response = await osuApiClient.get(`beatmap/${id}`)

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no getBeatmap:", message)
        throw new Error(message)
    }
}

export async function getGlobalRanking(mode: number): Promise<Array<IPlayer>>{
    
    try{
        const response = await osuApiClient.get(`ranking/global?mode=${mode}`)

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no getGlobalRanking:", message)
        throw new Error(message)
    }
}

export async function postCreateLink(id: string, name: string) {
    
    try{
        const response = await osuApiClient.post(`discord/createlink`, {
            discord_id: id,
            osu_name: name
        })

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no CreateLink:", message)
        throw new Error(message)
    }
}

export async function postCheckLink(id: string, code: string) {
    
    try{
        const response = await osuApiClient.post(`discord/checklink`, {
            discord_id: id,
            code: code
        })

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no CheckLink:", message)
        throw new Error(message)
    }
}

export async function postInvite(id: string) {
    
    try{
        const response = await osuApiClient.post(`invite/create`, { id: id })

        return response.data

    }catch(error){
        const message = getApiErrorMessage(error)

        console.log("Erro no postInvite:", message)
        throw new Error(message)
    }
}