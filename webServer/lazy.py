import math

f = open('lazy.sql','w')
f.write("use disciplan;\n")
n = 8;
s1 = "insert into TimeSpent values (\'"
s2 = "\',\'www.google.com\',\'2016-02-1"
s3 = " 05:17:50\',"
s4 = ");\n"
for i in range(n):
    sj = s1 + "jross3" + s2 + str(i) + s3 + str(int(math.sqrt(20*(i+1)))) + s4
    sd = s1 + "danthom" + s2 + str(i) + s3 + str(int(math.sqrt(15*i))) + s4
    f.write(sj)
    f.write(sd)
f.close()
