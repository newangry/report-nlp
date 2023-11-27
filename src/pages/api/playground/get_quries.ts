import readExcel from 'read-excel-file/node';

export default async function handler(
    req: any,
    res: any
) {
    const quires:string[] = await loadQueries();
    res.status(200).json(quires);
}

const loadQueries = async () => {
    const data = await readExcel('./Checklist.xlsx');
    const quires: string[] = [];
    for (let i in data) {
        for (let j in data[i]) {
            if(data[i][j]) {
                quires.push(data[i][j] as string);
            }
        }
    }
    quires.push("can you suggest similar international EIA reports for Service Corridors like this report?");
    return quires;
}
