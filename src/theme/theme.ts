export const theme = {
 colors:{
  background:'#030B17', navy:'#061121', surface:'#0C1D31', surfaceRaised:'#112940',
  glass:'rgba(13,32,52,0.90)', text:'#FFFFFF', muted:'#C1D0DF',
  gold:'#C59B5F', goldLight:'#F2D792', goldDeep:'#7F5926', cyan:'#5DE2E7',
  border:'rgba(197,155,95,0.45)', cyanBorder:'rgba(93,226,231,0.42)',
  danger:'#FFB4AB', success:'#B1E8CD', ink:'#061121'
 },
 gradients:{background:['#030B17','#0A2137','#030B17'] as const,panel:['#112940','#091727'] as const,gold:['#F2D792','#C59B5F','#AC7F40'] as const},
 spacing:{xs:4,sm:8,md:16,lg:24,xl:32,xxl:48},
 radius:{sm:12,md:20,lg:28,pill:999},
 type:{caption:12,body:16,subheading:20,title:30,hero:38},
 layout:{maxWidth:1160,tablet:760,desktop:1100,minTouch:48},
 motion:{minimumSplashMs:1200,videoWatchdogMs:4000,bootstrapTimeoutMs:12000,fadeMs:420}
} as const;
