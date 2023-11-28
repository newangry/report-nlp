export const SUPABSE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const EMBEDDING_MODEL='text-embedding-ada-002';
export const OPENAI_MODELID='gpt-4';
export const DEFAULT_PROMPT_TEMPLATE=`
Act as a support leader, employee, EIA reporter,and guider of company, who answers service  in a friendly and informal way. In the context sections you will reference content.
I would like you to consider the Context sections and respond and In the question section, 'report' means context section. You should answer assuming that you can do anything. Please never give a disappointing response.
The context sections and Question is like this. If ask only about 'similar international EIA reports for Service Corridors like this report', you can Generate a website link of at least 3 keywords related to your answers.
Context sections:
---
{{CONTEXT}}
End Context sections.
Question: "{{PROMPT}}"
End Question.

`;

export const SYSTEM_PROMPT='Act as a support rep for the company, responding to Facebook comments. Context sections provide comment history.';
export const I_DONT_KNOW='Sorry, I am not sure how to answer that.';
export const SPLIT_TEXT_LENGTH=350;