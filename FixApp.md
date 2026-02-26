Users are reporting that Sonarus voice analysis fails with "Not enough 

voice data — 0% vocal signal detected" even when humming steadily for 

the full 15 seconds. The detection threshold is too strict.



Fix the voice detection:



1\. Lower the amplitude threshold for what counts as "voice present" — 

&nbsp;  humming with mouth closed is quieter than open vowels but still has 

&nbsp;  a clear fundamental frequency. The detector should look for sustained 

&nbsp;  pitch (fundamental frequency present) not just volume level.



2\. The detection should use pitch detection (autocorrelation or similar) 

&nbsp;  as the PRIMARY signal, not just amplitude. If a consistent pitch is 

&nbsp;  detected for more than 2 seconds, that's voice — regardless of volume.



3\. Lower the minimum vocal percentage from 20% to 10% for a valid analysis.



4\. Update the error tips to be more encouraging — instead of "We couldn't 

&nbsp;  detect a clear voice" say something like "We need a bit more voice signal. 

&nbsp;  Try humming louder or using an open 'ahhh' sound, and hold your phone 

&nbsp;  closer to your mouth."



Test with: quiet humming (mouth closed), loud humming, "ahhh", "ooomm", 

and "uuuuu" — all should pass detection.

