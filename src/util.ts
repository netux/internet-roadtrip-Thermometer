import IRF from 'internet-roadtrip-framework';

export const zeroOne = (value: number, min: number, max: number) =>
  (value - min) / (max - min);

interface GM_fetchResponse {
  status: number;
  response: string;
}

export function GM_fetch(
  details: Parameters<typeof GM.xmlHttpRequest>[0],
): Promise<GM_fetchResponse> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      ...details,
      onload: (response) => resolve(response as GM_fetchResponse),
      onerror: (err) => reject(err),
    });
  });
}

export const waitForCoordinatesToBeSetAtLeastOnce = IRF.vdom.container.then(
  (containerVDOM) => {
    return new Promise<void>((resolve) => {
      containerVDOM.state.changeStop = new Proxy(
        containerVDOM.state.changeStop,
        {
          apply(ogChangeStop, thisArg, args) {
            const returnedValue = ogChangeStop.apply(thisArg, args);

            resolve();

            return returnedValue;
          },
        },
      );
    });
  },
);

export const offsetTimezone = (date: Date, utcOffsetSeconds: number): Date => {
  const localUtcOffsetUtcSeconds = -date.getTimezoneOffset() * 60;

  const result = new Date(date);
  result.setSeconds(
    result.getSeconds() - localUtcOffsetUtcSeconds + utcOffsetSeconds,
  );

  return result;
};
