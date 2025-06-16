export const load = ({ params, url }: {params: any, url: URL}) => {
    const stage = url.searchParams.get('stage');
    return {
        id: params.id,
        stage: stage || 'design'
    }
}