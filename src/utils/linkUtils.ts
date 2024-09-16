export const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
export const mainLinkRegex = /^(https?:\/\/[^&]+)/;
export const brazeParamRegex = /\?lid={{[^}]+}}/;
export const deeplinkRegex = /(&?\$deep_link=true.*)/;

export interface Link {
    fullUrl: string;
    mainLink: string;
    brazeParam: string | null;
    deeplink: string;
}

function extractLinkParts(href: string): Link {
    const mainLinkMatch = href.match(mainLinkRegex);
    const brazeParamMatch = href.match(brazeParamRegex);
    const deeplinkMatch = href.match(deeplinkRegex);

    let mainLink = mainLinkMatch ? mainLinkMatch[0] : href;
    let brazeParam = brazeParamMatch ? brazeParamMatch[0] : null;
    let deeplink = '';

    if (deeplinkMatch) {
        deeplink = deeplinkMatch[0];
        mainLink = href.substring(0, href.indexOf(deeplink));
    }

    // If there's no Braze parameter, check if there are any query parameters before the deeplink
    if (!brazeParam && mainLink.includes('?')) {
        const [baseLink, queryParams] = mainLink.split('?');
        mainLink = baseLink;
        brazeParam = '?' + queryParams;
    }

    return {
        fullUrl: href,
        mainLink,
        brazeParam,
        deeplink
    };
}

export function extractLinks(content: string): Link[] {
    const links: Link[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        const href = match[2];
        links.push(extractLinkParts(href));
    }

    return links;
}