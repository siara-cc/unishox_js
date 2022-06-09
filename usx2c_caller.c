#include <stdio.h>
#include <string.h>
#include "unishox2.h"

int main(int argc, char *argv[]) {
  char cbuf[1024];
  int clen;
  if (argc < 2)
    return 0;
  int len = (long)strlen(argv[1]);
  memset(cbuf, 0, sizeof(cbuf));
  clen = unishox2_compress_simple(argv[1], len, cbuf);
  for (int l=0; l<clen; l++) {
    if (l > 0)
      printf(",");
    printf("%u", (unsigned char) cbuf[l]);
  }
  return 0;
}
