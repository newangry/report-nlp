import { getBrands } from "@/utils/app/global";
import { Box, Button, Flex, Grid, List, Loader, Table, Text, TextInput, Textarea, ThemeIcon, rem, Image, Modal, ModalBase } from "@mantine/core";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dropzone } from '@mantine/dropzone';
import { IconCircleCheck, IconPdf, IconUpload } from '@tabler/icons-react';
import { getFilecontent } from "@/utils/app/train";
import { useChat } from "ai/react";
import ChatMessage from "@/components/Playground/ChatMessage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
    const [isTrain, setIsTrain] = useState<boolean>(false);
    const [query, setQuery] = useState<string>('');
    const [isLoad, setIsLoad] = useState<boolean>(false)
    const [files, setFiles] = useState<String[]>([])
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [answers, setAnswers] = useState<any>([]);
    const [opened, setOpened] = useState<boolean>(false);
    const [selAnswer, setSelAnswer] = useState<any>({
        text: '',
        matched_arr: []
    })
    const { messages, append, setMessages, reload, isLoading } = useChat({
        api: '/api/playground/chat', initialInput: 'test',
        body: {
            query
        }
    });

    useEffect(() => {
        initLanguage();
        getFiles()
    }, [])

    const initLanguage = () => {
        var addScript = document.createElement("script");
        addScript.setAttribute(
            "src",
            "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        );
        document.body.appendChild(addScript);
        (window as any).googleTranslateElementInit = googleTranslateElementInit;
    }

    const googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
            {
                pageLanguage: "en",
                autoDisplay: false
            },
            "google_translate_element"
        );
    };

    const handleSend = async () => {
        if (query == "") {
            alert("Input query")
        } else {
            setMessages([]);
            append({
                content: 'test',
                role: "user",
                createdAt: new Date()
            })
        }
    }

    const trainFile = async (file: File) => {
        setIsTrain(true);
        const file_content = await getFilecontent(file);
        try {
            const res = await fetch("/api/train/train_file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(file_content),
            });
            getFiles()

        } catch (e) {
            console.log(e);
        }
        setIsTrain(false);
    }

    const getFiles = async () => {
        setIsLoad(true);
        const res = await fetch('/api/train/get_files', {
            method: 'post'
        })
        if (res.status == 200) {
            const data = await res.json();
            setFiles(data)
        }
        setIsLoad(false);
    }

    const generateAnswer = async () => {
        setLoadingData(true)
        let res = await fetch('/api/playground/get_quries');
        let excel: any = [];
        let after_excel: any = [];
        const data: any = [];
        if (res.status == 200) {
            excel = await res.json();
            after_excel = JSON.parse(JSON.stringify(excel));
            console.log("----After Excel----")
            console.log(after_excel)
            const quires: any = [];
            excel.map((item: any) => {
                if (!item.is_header) {
                    quires.push(item)
                }
            })
            console.log("____quires-------")
            console.log(quires);
            for (let k = 0; k < quires.length; k += 10) {
                let promises: any = [];
                for (let j = k; j < k + 10; j++) {
                    if (j >= quires.length) {
                        break;
                    }
                    promises.push(getAnswer(quires[j].text));
                    console.log(quires[j].text)
                }
                const result = await Promise.all(promises);
                result.map((item_1) => {
                    if (item_1 && item_1.answer != "") {
                        data.push(item_1);
                    }
                })
            }
        }

        console.log("------Data---------")
        console.log(data);
        console.log(console.log(after_excel));
        data.map((item__: any) => {
            let index = 0;
            for (let k = 0; k < after_excel.length; k++) {
                if (after_excel[k].text == item__.query) {
                    index = k;
                }
            }
            after_excel[index]['answer'] = item__.answer;
            after_excel[index]['matched_arr'] = item__.matched_arr;
        })

        // const excel_ = excel.filter((item: any) => item.answer !="" || item.is_header);

        const excel_: any = [];
        after_excel.map((item_: any) => {
            if (item_.answer != "" || item_.is_header) {
                excel_.push(item_);
            }
        })
        setAnswers(excel_);
        setLoadingData(false)
    }

    const getAnswer = async (query: string) => {
        try {
            const res = await fetch('/api/playground/chat', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query
                }),
            })

            if (res.status == 200) {
                const data = await res.json();
                return data;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    return (
        <Box >
            <Flex justify={'space-between'} align={'center'} p={15} sx={(theme) => ({
                borderBottom: `1px solid #dbd7d7`
            })}>
                <Flex align={'center'} >
                    <Image src='/logo.jpg' alt="" width={200} />
                    <Box>
                        <Text size={25}>
                            ESIA Reports Automatic Assessment Solution
                        </Text>
                        <Text size={25} align="right">
                            النظام الالي لمراجعة تقارير تقييم الاثر البيئي والاجتماعي
                        </Text>
                    </Box>
                </Flex>
            </Flex>
            <Grid gutter={50} p={20}>
                <Grid.Col md={3} lg={3} sm={12}>
                    <Flex justify={'center'} gap={40} w={'100%'} direction={'column'}>
                        <Flex direction={'column'} gap={20}>
                            <Dropzone
                                accept={{
                                    'image/*': [], // All images
                                    'text/html': ['.html', '.htm', '.pdf', '.doc', '.docx', '.xls', '.csv', '.xlsx'],
                                }}
                                bg={'#F4F6F8'}
                                pt={30}
                                pb={30}
                                w={'100%'}
                                onDrop={(files) => {
                                    trainFile(files[0])
                                }}
                                loading={isTrain}
                            >
                                <Flex
                                    justify={'center'}
                                    gap={5}
                                    direction={'column'}
                                    align={'center'}
                                >
                                    <IconUpload color="#919EAB" />
                                    <Text color="#919EAB" size={14}>
                                        Drag files here to upload
                                    </Text>
                                    <Text color="#18232A" size={13}
                                        weight={500}
                                        sx={(theme) => ({
                                            textDecoration: 'underline'
                                        })}
                                    >
                                        or browse for files
                                    </Text>
                                </Flex>
                            </Dropzone>
                            <Button color="green"
                                disabled={loadingData}
                                onClick={() => {
                                    generateAnswer()
                                }}>
                                Generate Answer!
                            </Button>
                        </Flex>
                        <Flex justify={'center'} gap={20} direction={'column'} >

                            {
                                isLoad ? <Flex align={'center'} justify={'center'} ><Loader /></Flex> :
                                    files.length == 0 ?
                                        <Text align="center">No Uploaded files</Text> :
                                        <List
                                            spacing="xs"
                                            size="sm"
                                            center
                                            icon={
                                                <ThemeIcon color="teal" size={24} radius="xl">
                                                    <IconPdf style={{ width: rem(16), height: rem(16) }} />
                                                </ThemeIcon>
                                            }
                                        >
                                            {
                                                files.map((item: any, index) =>
                                                    <List.Item key={index}>{item.name}</List.Item>
                                                )
                                            }
                                        </List>

                            }
                        </Flex>
                    </Flex>
                </Grid.Col>
                <Grid.Col md={9} lg={9} sm={12}>
                    {

                        answers.length == 0 ?
                            <Box>
                                <Text align="center" size={"xl"}>
                                    No generated Answer
                                </Text>
                                <Text align="center" size={'sm'} color="green">
                                    {`Please click "Generate Answer!" button`}
                                </Text>
                            </Box> :
                            <Table>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Question</th>
                                        <th>Answer</th>
                                        <th>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        answers.map((item: any, key: number) =>
                                            <tr
                                                key={key}
                                                style={{
                                                    background: item.is_header ? 'green' : 'white',
                                                    color: item.is_header ? 'white' : 'black'
                                                }}
                                            >
                                                <td width={'7%'}>{item.no}</td>
                                                <td width={'44%'}>{item.text}</td>
                                                <td width={'44%'}>
                                                    <ChatMessage
                                                        message={item.answer}
                                                    />
                                                </td>
                                                <td width={'7%'} style={{ color: 'green' }} onClick={() => {
                                                    setOpened(true)
                                                    setSelAnswer(item);
                                                }}>Detail</td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </Table>
                    }
                    <Box mt={'20px'}>
                        {
                            loadingData ? <Flex align={'center'} justify={'center'}><Loader /></Flex> : <></>
                        }
                    </Box>
                </Grid.Col>
            </Grid>
            <Modal opened={opened} onClose={() => { setOpened(false) }} title={<Text color="green">{selAnswer.text}</Text>} size={'lg'}>
                <Flex direction={'column'} gap={20}>
                    {
                        selAnswer.matched_arr.map((item: any, key: number) =>
                            <Text key={key}>
                                ...{item}...
                            </Text>
                        )
                    }
                </Flex>
            </Modal>
        </Box>
    )
}

export default Index;