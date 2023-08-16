document.addEventListener( "DOMContentLoaded", function() {
    document.querySelector( '#app form' ).addEventListener('submit', function( e ) {
        e.stopPropagation();
        e.preventDefault();
        if ( document.querySelector( '#openai_token' ).value.length < 1 ) {
            alert( 'You forgot about the OpenAI token' );
            return;
        }
        if ( document.querySelector( '#prompt' ).value.length < 1 ) {
            alert( 'Prompt cannot be empty' );
            return;
        }

        document.querySelector( '#output' ).value = 'WAIT PLIZ. Generating...';
        document.querySelector( '#assembler_links' ).innerHTML = '';

        const token = document.querySelector( '#openai_token' ).value;
        const model = document.querySelector( '#openai_model' ).options[ document.querySelector( '#openai_model' ).selectedIndex ].value;

        let replacements = {
            SEP: '<--------------->',
            PROMPT: document.querySelector( '#prompt' ).value,
            PATTERNS: document.querySelector( '#pattern_descriptions' ).value,
        };

        openaiCall(
            token,
            model,
            document.querySelector( '#prompt_layout' ).value,
            replacements
        ).then( output => {
            replacements['LAYOUT'] = output;
            return openaiCall(
                token,
                model,
                document.querySelector( '#prompt_patterns' ).value,
                replacements
            );
        } ).then( output => {
             document.querySelector( '#output' ).value = output;
             return getPatternMap();
         } ).then( patternMap => {
            return Promise.resolve( mapOutputToPages( document.querySelector( '#output' ).value, replacements, patternMap ) );
        } ).then( pages =>{
            console.log( pages );
            pages.forEach( page => {
                const link = document.createElement( 'LI' );
                link.innerHTML = `<a target='_blank' href='https://container-great-cori.calypso.live/setup/with-theme-assembler/patternAssembler?ref=calypshowcase&siteSlug=patternassemblertest2.wordpress.com&pattern_ids=${page.patterns.join( ',' )}'>${page.title}</a>`;
                document.querySelector( '#assembler_links' ).appendChild( link );
            } );
        } );

    } );
} );

function mapOutputToPages( output, replacements, patternMap ) {

    pages = output.split( replacements[ 'SEP' ] );
    pages = pages.map( page => {
        let lines = page.trim().split(/\r?\n/);

        if ( lines.length < 2 ) {
            return false;
        }

        lines = lines.filter( line => line.length > 1 );
        return {
            title: lines[0],
            patterns: lines.slice(1).map( line => {
                document.getElementById('result_total').innerText = parseInt( document.getElementById('result_total').innerText ) + 1;
                if ( ! patternMap[ line ] ) {
                    console.warn( 'Missing pattern: ' + line, lines[0] );
                    document.getElementById('result_hal').innerText = parseInt( document.getElementById('result_hal').innerText ) + 1;
                    return false;
                }
                return patternMap[ line ]
            } ).filter( Boolean ),
        };
    } ).filter( Boolean );
    return pages;
}


async function getPatternMap() {
    const response = await fetch( 'https://public-api.wordpress.com/rest/v1/ptk/patterns/en' );
    const data = await response.json();
    const patternMap = {};
    data.forEach(element => {
        patternMap[ element.name ] = element.ID;
    });
    return patternMap;
}

async function openaiCall( token, model, prompt, replacements = {} ) {

    for ( const pat in replacements ) {
        prompt = prompt.replaceAll( "[" + pat + "]", replacements[ pat ] );    
    }

    const requestBody = JSON.stringify({
        model: model,
        temperature: 0,
        messages: [
            {
                role: 'user',
                content: prompt,
            }
        ]
    });    
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: requestBody,
    };

    try {
        const response = await fetch( 'https://api.openai.com/v1/chat/completions', requestOptions );
        const data = await response.json();
        console.log( data );
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('No response text received from the AI model.');
        }
    } catch (error) {
        console.error('Error calling GPT API:', error);
        return null;
    }

}
