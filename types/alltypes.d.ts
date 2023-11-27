declare module 'react-timeago/lib/formatters/buildFormatter';
declare module '@canvasjs/react-charts';
declare module 'openai-edge';
declare global {
    namespace nodejs {
        interface global {
            signin(): string[]
        }
    }
}