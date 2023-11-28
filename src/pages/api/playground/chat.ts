import { supabase, supabaseAdmin } from '@/utils/server/supabase-admin';
import type { NextApiRequest, NextApiResponse } from 'next'
import { createEmbedding } from '@/utils/server/generate-embeddings';
import { DEFAULT_PROMPT_TEMPLATE, I_DONT_KNOW, SPLIT_TEXT_LENGTH } from '@/utils/server/consts';
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi, ResponseTypes } from 'openai-edge'
import xlsx from 'xlsx';


const config_openai = new Configuration({
    apiKey: process.env.OPENAI_API_KEY_3
})
const openai = new OpenAIApi(config_openai)

if (!process.env.OPENAI_API_KEY_3)
    console.warn(
        'OPENAI_API_KEY has not been provided in this deployment environment. ' +
        'Will use the optional keys incoming from the client, which is not recommended.',
    );

export default async function handler(
    req: any,
    res: any
) {
    try{
        const query = req.body.query;
        const result = await getAnswer(query);
        res.status(200).json(result);
    }catch(e){
        res.status(201).json({})
    }
    
}   

const getAnswer = async (query: string) => {
    const embedding_data = await createEmbedding(query);
    const matched_data = await supabaseAdmin.rpc("matched_sections", {
        embedding: embedding_data.embedding.data[0].embedding,
        match_threshold: 0.76,
        match_count: 25,
    });
    let context = "";
    let matched_arr: string[] = [];
    for (let k = 0; k < matched_data.data.length; k++) {
        context += matched_data.data[k].text;
        matched_arr.push(matched_data.data[k].text);
    }

    let full_prompt = DEFAULT_PROMPT_TEMPLATE
        .replace('{{I_DONT_KNOW}}', I_DONT_KNOW)
        .replace('{{CONTEXT}}', context)
        .replace('{{PROMPT}}', query)
    const messages = [
        {
            role: 'user',
            content: full_prompt
        }
    ];

    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        stream: false,
        temperature: 0.5,
        messages
    })

    const data = (await response.json())
    if(data.choices){
        return {query, answer: data.choices[0].message.content, matched_arr};
    } else {
        console.log(data);
        return {query, answer:'', matched_arr}
    }
}
